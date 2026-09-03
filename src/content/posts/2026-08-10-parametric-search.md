---
title: "이분 탐색을 답에서 하기 — 파라메트릭 서치"
description: "정렬된 배열에서 값을 찾는 게 아니라, 가능한 답의 범위에서 경계를 찾는 방법."
date: 2026-08-10
tags: ["알고리즘", "이분탐색", "Java"]
---

이분 탐색은 보통 "정렬된 배열에서 특정 값 찾기"로 배웁니다. 그런데 실제 문제에서 더 자주 나오는 건 **답 자체를 이분 탐색하는** 형태입니다. 처음에 이 전환이 잘 안 돼서 정리해 둡니다.

## 언제 쓰는가

문제가 이런 모양이면 의심해 볼 만합니다.

- "최댓값을 최소로 하라" 또는 "최솟값을 최대로 하라"
- 답의 범위는 넓지만, 특정 답이 가능한지 판정하는 건 쉽다

핵심 조건은 **단조성**입니다. 어떤 값 `x` 가 가능하면 `x` 보다 작은(혹은 큰) 값도 전부 가능해야 합니다. 그래야 참/거짓의 경계가 하나로 정해지고, 그 경계를 이분 탐색으로 찾을 수 있습니다.

## 예: 랜선 자르기

길이가 제각각인 랜선 N개를 잘라서 같은 길이의 랜선 K개를 만들 때, 가능한 최대 길이를 구하는 문제입니다.

길이를 `x` 로 정하면 만들 수 있는 개수는 `sum(길이 / x)` 로 바로 계산됩니다. 그리고 `x` 가 커질수록 개수는 단조 감소합니다. 단조성이 있으므로 이분 탐색이 됩니다.

```java title="LanCable.java" {12-17}
public class LanCable {

    static int[] cables;
    static int k;

    static long solve() {
        long low = 1;
        long high = Arrays.stream(cables).max().orElse(1);
        long answer = 0;

        while (low <= high) {
            long mid = (low + high) / 2;
            if (count(mid) >= k) {
                answer = mid;   // 가능하니 일단 답으로 저장하고
                low = mid + 1;  // 더 긴 길이를 노려본다
            } else {
                high = mid - 1;
            }
        }
        return answer;
    }

    static long count(long length) {
        long total = 0;
        for (int cable : cables) {
            total += cable / length;
        }
        return total;
    }
}
```

강조한 부분이 전부입니다. **가능하면 답을 갱신하고 경계를 밀고, 불가능하면 반대로 좁힌다.** 값을 찾는 이분 탐색과 달리 `answer` 변수를 따로 두는 게 포인트입니다.

## 자주 하는 실수

`low = 0` 으로 시작하면 `cable / 0` 에서 터집니다. 길이 문제의 하한은 보통 1입니다.

그리고 `mid` 계산에서 `(low + high) / 2` 는 값이 클 때 오버플로가 납니다. Java에서 `int` 로 다루면 21억을 넘는 순간 음수가 되니, `long` 을 쓰거나 이렇게 씁니다.

```java
long mid = low + (high - low) / 2;
```

## 복잡도

| 항목 | 복잡도 |
| --- | --- |
| 탐색 횟수 | O(log(최대 답)) |
| 판정 함수 | O(N) |
| 전체 | O(N log(최대 답)) |

답의 범위가 10억이어도 log를 씌우면 30번입니다. 판정만 빠르면 전체가 빠릅니다.

<details>
<summary>입력 처리까지 포함한 전체 코드</summary>

```java title="Main.java"
import java.io.*;
import java.util.*;

public class Main {

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());

        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());

        int[] cables = new int[n];
        for (int i = 0; i < n; i++) {
            cables[i] = Integer.parseInt(br.readLine());
        }

        long low = 1;
        long high = Arrays.stream(cables).max().orElse(1);
        long answer = 0;

        while (low <= high) {
            long mid = low + (high - low) / 2;

            long total = 0;
            for (int cable : cables) {
                total += cable / mid;
            }

            if (total >= k) {
                answer = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        System.out.println(answer);
    }
}
```

</details>
