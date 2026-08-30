# 사용자 테스트 체크리스트

이 문서는 Grabit에서 사용자가 직접 확인해야 할 항목만 정리한다. 테스트는 **지금 가능한 무지갑 테스트**와 **자금 준비 후 진행할 BSC Testnet 테스트**로 나눈다.

## 1. 지금 바로 할 테스트 — 약 5분

사이트: https://grabit-bnb-hackathon.duddlfqotl.chatgpt.site/

### A. 상점과 이동

- [ ] 메인 화면의 Agent Store에 4개 카테고리가 보인다.
- [ ] Agent 카드 하나를 누르면 선택한 Agent의 Activate 화면으로 바로 이동한다.
- [ ] `BACK TO AGENT STORE`를 누르면 상점 위치로 돌아간다.
- [ ] 화면 전환 애니메이션이 끊기거나 번쩍이지 않는다.
- [ ] 글자가 작거나 눈이 아픈 영역이 없다.

### B. 네 Agent 결과 미리보기

각 Agent에서 `PREVIEW AGENT RESULT`를 한 번씩 누른다.

| Agent | 확인할 대표 결과 |
| --- | --- |
| Rebalancing | `REBALANCE $1,000 WBNB INTO USDT`, 목표 50/50 |
| Grid Trading | 10개 Grid, 약 1.67% 간격, 주문당 $100 |
| Yield Optimisation | `LIVE_ONCHAIN`, Venus Core 시장 5개 비교, 최신 Venus block 표시 |
| Health Factor Monitoring | Health Factor 1.60, 20% stress 1.28 |

모든 Agent에서 공통으로 확인한다.

- [ ] 결론, 핵심 수치 4개, 다음 행동, 위험이 한 카드에 보인다.
- [ ] `PREVIEW`, `NO JOB · NO SIGNATURE`, `NO CAPITAL MOVED`가 표시된다.
- [ ] 실제 실행이나 수익처럼 오해할 표현이 없다.
- [ ] `REFRESH PREVIEW`를 눌러도 오류가 발생하지 않는다.
- [ ] Yield 결과는 다른 Agent보다 조금 늦더라도 정상적으로 완료된다.

### C. 화면 크기와 사용성

- [ ] 데스크톱 전체 화면에서 양옆 공간이 지나치게 남지 않는다.
- [ ] 브라우저 폭을 좁혀도 카드와 버튼이 화면 밖으로 넘어가지 않는다.
- [ ] 125% 확대에서도 주요 버튼과 수치를 읽을 수 있다.
- [ ] 소리 옵션을 켰을 때만 버튼음이 들리고, 껐을 때는 조용하다.

## 2. 나중에 할 BSC Testnet 테스트

다음 조건이 준비된 후 진행한다.

- Provider 주소에 최소 0.002 tBNB gas
- 사용자 테스트 지갑에 tBNB
- 사용자 테스트 지갑에 최소 0.10 test $U

### A. 지갑 사전 점검

- [ ] 지갑 연결이 정상 동작한다.
- [ ] BSC Testnet chain 97 전환이 정상 동작한다.
- [ ] `RUN PREFLIGHT` 결과가 5/5 PASS다.
- [ ] Mainnet 자산을 쓰지 않는다는 안내가 보인다.

### B. Hire 실행

- [ ] Create Job
- [ ] Bind Policy
- [ ] Set Budget
- [ ] Approve exactly 0.10 test $U
- [ ] Fund test escrow

각 단계에서 확인창은 한 번만 나타나야 하며, 이전 단계가 완료되기 전 다음 단계가 실행되면 안 된다.

### C. Agent 결과와 정산

- [ ] `RUN AGENT + SUBMIT RESULT`가 성공한다.
- [ ] 선택한 카테고리에 맞는 결과 카드가 표시된다.
- [ ] Job ID, transaction hash, source block을 확인할 수 있다.
- [ ] 15분 dispute window가 표시된다.
- [ ] 시간이 지난 뒤 `SETTLE TESTNET JOB`이 성공한다.

## 3. 오류를 알려줄 때 필요한 것

아래 세 가지만 전달하면 된다.

1. Agent 이름
2. 실패한 버튼 또는 단계
3. 화면 캡처 한 장 또는 표시된 오류 문구

Testnet 트랜잭션 문제라면 transaction hash도 함께 전달한다. 개인키와 시드 문구는 절대 전달하지 않는다.
