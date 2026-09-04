---
postId: 22
title: "JPA N+1 문제, 어디서 터지고 어떻게 막았나"
description: "주문 목록 API가 갑자기 느려진 이유를 쿼리 로그부터 되짚어 본 기록."
date: 2026-08-24
tags: ["Spring", "JPA", "MySQL"]
---

주문 목록 API 응답이 느려서 쿼리 로그를 켜 봤더니 요청 한 번에 SQL이 40개 넘게 나가고 있었습니다. 전형적인 N+1이었는데, 알고는 있었지만 실제로 마주치니 원인을 짚는 데 시간이 꽤 걸려서 정리해 둡니다.

## 문제가 된 코드

```java title="OrderService.java"
@Transactional(readOnly = true)
public List<OrderResponse> findAll() {
    return orderRepository.findAll().stream()
            .map(OrderResponse::from)
            .toList();
}
```

겉보기에는 문제가 없습니다. 문제는 `OrderResponse.from()` 안에 있었습니다.

```java title="OrderResponse.java" {6}
public static OrderResponse from(Order order) {
    return new OrderResponse(
            order.getId(),
            order.getStatus(),
            // 여기서 Member를 건드리는 순간 프록시가 깨지며 SELECT가 나갑니다
            order.getMember().getName()
    );
}
```

`Order` 와 `Member` 는 `@ManyToOne(fetch = LAZY)` 관계입니다. `findAll()` 로 주문 20건을 가져올 때 SQL은 1번 나가지만, 각 주문의 `getMember().getName()` 을 호출하는 순간 멤버를 가져오는 SELECT가 건당 한 번씩 추가로 나갑니다. 그래서 1 + 20 = 21번입니다.

## 해결 1: fetch join

가장 직접적인 방법은 처음부터 조인해서 한 번에 가져오는 것입니다.

```java title="OrderRepository.java"
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o JOIN FETCH o.member")
    List<Order> findAllWithMember();
}
```

이러면 SQL이 1번으로 줄어듭니다.

```sql {2}
SELECT o.id, o.status, o.created_at, m.id, m.name
FROM orders o
INNER JOIN member m ON m.id = o.member_id;
```

다만 fetch join은 컬렉션(`@OneToMany`)에는 조심해서 써야 합니다. 컬렉션을 fetch join 하면 결과 행이 곱해지면서 페이징이 깨집니다. 하이버네이트가 경고 로그를 남기고 메모리에서 페이징을 시도하는데, 데이터가 많으면 그대로 사고입니다.

## 해결 2: batch fetch size

컬렉션까지 얽혀 있다면 이쪽이 더 안전합니다.

```yaml title="application.yml"
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100
```

이 설정을 켜면 하이버네이트가 지연 로딩을 건당 SELECT로 처리하지 않고 `IN` 절로 묶어서 가져옵니다.

```sql
SELECT * FROM member WHERE id IN (1, 2, 3, ..., 20);
```

쿼리 수가 N개에서 `N / batch_size` 로 줄어듭니다. 전역 설정 하나로 대부분의 N+1을 완화할 수 있어서, 저는 이걸 먼저 깔아두고 문제가 남는 지점만 fetch join으로 잡는 쪽이 낫다고 판단했습니다.

## 정리

| 방법 | 쿼리 수 | 페이징 | 언제 |
| --- | --- | --- | --- |
| 그대로 | 1 + N | 가능 | 쓰면 안 됨 |
| fetch join | 1 | 컬렉션이면 깨짐 | ToOne 관계 |
| batch size | 1 + N/100 | 가능 | 컬렉션 포함, 기본값으로 |

가장 중요한 건 **쿼리 로그를 켜 두는 것**이었습니다. 안 보면 모릅니다.

```yaml title="application.yml"
logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
```
