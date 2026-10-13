# Expansion V1 (深度擴充 60 題) 題庫審查與架構報告

**版本**：Expansion V1.0  
**基準題數**：經典版 70 題 ＋ 深度擴充 60 題 ＝ 完整題庫 130 題  
**審查狀態**：全部 60 題均通過 Content Review Workflow（`reviewStatus: 'approved'`，`needsReview: false`）

---

## 一、題庫總覽與結構分佈

| 牌組難度 | 題數 | 互動類型分佈 | 情感基調分佈 | 主要話題範疇 |
|---|:---:|---|---|---|
| **破冰 (Icebreaker)** | 15 | single (5), all (4), pair (2), discussion (2), chooseOne (1), action (1) | light (13), warm (2) | daily-life, preferences, identity, perception |
| **一星 (One-Star)** | 15 | single (6), pair (3), othersToDrawer (2), discussion (2), all (1), chooseOne (1) | reflective (7), warm (6), light (2) | memories, values, growth, relationships |
| **二星 (Two-Star)** | 15 | single (5), pair (3), discussion (3), othersToDrawer (2), all (1), chooseOne (1) | reflective (12), warm (3) | trust, boundaries, conflict, authenticity |
| **三星 (Three-Star)** | 15 | single (6), discussion (3), othersToDrawer (3), pair (2), chooseOne (1) | vulnerable (7), warm (4), reflective (4) | repair, belonging, meaning, future |
| **總計** | **60** | **單人 22 / 雙人與群體互動 38** | **光譜平衡完整（溫暖／沉澱／微脆弱交錯）** | **與完整題庫共同覆蓋 19 個主題維度** |

---

## 二、核心修復與品質強化點 (Question System V2.1 / V2.2)

### 1. 星級卡面統一衍生 (`deriveStarsFromLevel`)
- **問題**：先前 Expansion 卡片僅宣告 `level`，未獨立宣告 `stars`，導致部分卡片正面缺少星號。
- **修復**：`CardFront` 與資料層採用統一規則衍生星級：
  - `icebreaker` → 無星號
  - `one-star` → ★
  - `two-star` → ★★
  - `three-star` → ★★★
- **保證**：所有 130 張卡片均具有統一嚴謹的卡面視覺規範。

### 2. `chooseOne` 互動與回答者語意模型修正
- **問題**：`chooseOne` 若未設定 `responderRule`，在指示文案中容易產生「抽牌者指定對象，但到底誰回答」的語意混淆。
- **修復**：
  - `exp1-one-11` (生活重置): `responderRule: 'selectedPlayers'`，抽牌者指定一人回答。
  - `exp1-two-11` (同理直覺): `responderRule: 'selectedPlayers'`，抽牌者挑選一人分享最深刻經驗。
  - `exp1-three-09` (關係修復): `responderRule: 'selectedPlayers'`，指定一人回應，雙方對話交流。
- **驗證**：已通過單元測試確認指定對象正確填入 `ResolvedInteraction.responders`。

### 3. 深入追問 (Follow-Up Prompts) 系統
- **設計理念**：實體對話卡牌最珍貴之處在於引導對話展開，而非一問一答快速滑過。
- **實作**：
  - 精選深度題附有延伸追問（包含 `zh`, `en` 雙語引導）。
  - UI 呈現為細緻典雅的受控手風琴元件（「再問深一點」/「收起深入追問」）。
  - 當抽牌者展開或收合追問時，即時透過 WebRTC 廣播同步至全桌手機，並將深度願意度訊號提供給 Conversation Engine。

### 4. 嚴格審查機制 (Review Workflow Enforcement)
- **規範**：`expansionCard()` 工廠函式支援審核狀態追蹤。
- **門禁防線**：`assertCardDatabase()` 在生產環境建置（`npm run build`）及測試執行時，強制執行嚴格門禁：
  - `reviewStatus === 'approved'`（嚴禁 `draft` 或 `content-reviewed` 流入 production）
  - `needsReview !== true`
  - 核心元資料（`topic`, `intensity`, `emotionalTone`, `relationshipTags`, `packId`, `zh`, `en`）必須 100% 齊備。
- **保證**：杜絕任何未校對、未通過編輯審查的草稿題目意外流入 production。

---

## 三、Conversation Engine 智慧對話弧線串接

1. **題目多維元資料 (Metadata Enrichment)**：
   - 全國 130 題（原版 70 ＋ 擴充 60）皆具備：
     - `topic`：避免同主題連續出現（Topic anti-clumping）
     - `intensity` (1~5)：重度情感題後自動提供呼吸空間（Emotional breathing space）
     - `emotionalTone`：情緒色調交錯
     - `relationshipTags` / `relationshipFit`：適配朋友、伴侶、約會、家人或多人聚會
     - `sensitivity`：敏感標籤（grief, family, conflict 等）間距防護
2. **開場第一張題目的關係情境適配**：
   - 啟動時即以 `scoreCandidate` 計算開場牌，讓選擇「約會」或「伴侶」的玩家在第一張牌即感受到情境契合度。
3. **無損牌庫原則**：
   - 智慧排序完全保留 100% 牌庫池，不刪除任何題目，僅優化抽牌順序體驗。

---

## 四、測試驗證清單

- [x] 所有 60 張擴充卡結構、難度、翻譯、互動邏輯驗證（`tests/question_bank.test.ts`）
- [x] 題庫資料庫審查狀態檢查與嚴格門禁測試（`tests/deck.test.ts`）
- [x] 抽牌互動與選擇回答者模型驗證（`tests/interaction.test.ts`）
- [x] 對話節奏引導演算法與主題分散測試（`tests/conversation_engine.test.ts`）
- [x] 單機模式、多人連線權限、斷線處置與狀態同步驗證（`tests/semantics_and_authority.test.ts`）
- [x] V2.2 核心架構修正完整性測試（`tests/v2_2_features.test.ts`）
