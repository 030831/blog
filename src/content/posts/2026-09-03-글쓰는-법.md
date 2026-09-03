---
title: "이 블로그에 글 쓰는 법"
description: "마크다운 문법과 코드 블록 기능 정리. 새 글을 쓰기 전에 이 글만 보면 됩니다."
date: 2026-09-03
tags: ["블로그"]
---

글은 `src/content/posts/` 폴더에 마크다운 파일을 만들면 됩니다. 파일 이름이 그대로 주소가 되므로 `2026-09-03-jpa-n-plus-one.md` 는 `/posts/2026-09-03-jpa-n-plus-one/` 이 됩니다.

## 프론트매터

모든 글은 이 블록으로 시작합니다.

```yaml title="글 맨 위"
---
title: "글 제목"
description: "목록과 검색 결과에 보이는 한 줄 요약"
date: 2026-09-03
tags: ["Spring", "JPA"]
draft: false
---
```

`title` 과 `date` 만 필수입니다. `draft: true` 면 로컬에서는 보이지만 배포된 사이트에는 나가지 않습니다. 쓰다 만 글을 그냥 커밋해 둬도 안전합니다.

## 코드 블록

기본은 언어 이름만 적으면 됩니다.

```java
public record Order(Long id, String status) {}
```

### 파일명 붙이기

`title="..."` 을 붙이면 위에 파일명 바가 생깁니다. 어느 파일 이야기인지 밝힐 때 씁니다.

````text
```java title="OrderService.java"
```
````

```java title="OrderService.java"
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        return orderRepository.findAllWithMember().stream()
                .map(OrderResponse::from)
                .toList();
    }
}
```

### 특정 줄 강조하기

`{3-5}` 처럼 중괄호에 줄 번호를 적으면 그 줄만 강조됩니다. "여기가 핵심" 이라고 말할 때 화살표 대신 쓰면 깔끔합니다.

````text
```sql {3-4}
```
````

```sql {3-4}
SELECT o.id, o.status, m.name
FROM orders o
JOIN member m ON m.id = o.member_id
WHERE o.status = 'READY'
ORDER BY o.created_at DESC;
```

### 긴 코드 접기

전체 코드는 길지만 맥락상 필요할 때 `<details>` 로 접어둘 수 있습니다.

<details>
<summary>전체 설정 파일 보기</summary>

```yaml title="application.yml"
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/blog?serverTimezone=UTC
    username: root
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_batch_fetch_size: 100
        format_sql: true
```

</details>

## 표

| 자료구조 | 조회 | 삽입 | 비고 |
| --- | --- | --- | --- |
| ArrayList | O(1) | O(n) | 인덱스 접근이 잦으면 |
| LinkedList | O(n) | O(1) | 중간 삽입이 잦으면 |
| HashMap | O(1) | O(1) | 순서 보장 안 됨 |

넓은 표는 자동으로 가로 스크롤됩니다. 모바일에서 화면이 밀리지 않습니다.

## 인용과 강조

> 성능 문제는 측정하기 전까지는 추측일 뿐이다.

**굵게**, *기울임*, `인라인 코드`, [링크](https://docs.spring.io/) 모두 됩니다.

## 새 글 만들기

파일을 직접 만들어도 되지만 명령어 하나로 프론트매터까지 채워 만들 수 있습니다.

```bash
npm run new "JPA N+1 문제 해결하기"
```
