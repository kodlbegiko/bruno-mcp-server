# 《深刻認識一個人》卡牌資料庫審核報告 (Card Ingestion & Audit)

## 1. 審核總覽 (Audit Summary)

- **素材來源**：`暖身破冰.pdf`、`一星連結.pdf`、`二星連結.pdf`、`三星連結.pdf`、`背面照片.pdf`
- **核對卡數**：
  - 暖身破冰 (Break The Ice): **10 張**
  - 一星連結 (One-Star Connection): **20 張**
  - 二星連結 (Two-Star Connection): **20 張**
  - 三星連結 (Three-Star Connection): **20 張**
  - **總計**: **70 張** (無新增、無刪減、無重複)
- **審核狀態**: **70 / 70 cards verified** (100% 通過人工核對原始 PDF 截圖)
- **是否仍有疑義**: **0 筆** (無未確認文字，所有文字與排版皆與實體卡一致)

---

## 2. 逐卡審核詳細清單

### 暖身破冰 (Break The Ice) - 10 張

| 卡牌 ID | 星級 | 中文題目 | 英文內容 | 互動類型 | 回答規則 | 目標對象 | 辨識狀態 | 備註 |
|---|---|---|---|---|---|---|---|---|
| `ice-01` | 0 | 所有玩家用十秒唱一首最喜歡的歌。 | **Sing It Out!** - Each player has 10 seconds to sing their favorite song. | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_01.jpg |
| `ice-02` | 0 | 所有玩家打開手機，挑一張最近拍的照片並說說它的故事。 | **Photo Story** - Open your phone, pick a recent photo, and tell its story. | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_02.jpg |
| `ice-03` | 0 | 你認為你的形象是什麼？你做過什麼與你形象不符的事（所有玩家回答）。 | **Who Are You, Really?** - How do you think people see you? Have you ever done something totally opposite of that image? | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_03.jpg |
| `ice-04` | 0 | 所有玩家分享你小時候的樣子給大家看！ | **Throwback Time!** - Show a childhood picture of yourself! | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_04.jpg |
| `ice-05` | 0 | 所有玩家分享兩件今日想感恩的事情。 | **Gratitude Check** - Share two things you're grateful for today. | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_05.jpg |
| `ice-06` | 0 | 抽到卡的人，指定兩位玩家扮最醜的鬼臉！並且合影一張做記錄。 | **Funny Face Challenge** - Pick two players to make their ugliest face and take a picture together! | `action` | `selectedPlayers` | `none` | ✅ 成功辨識 | Verified from ice_06.jpg |
| `ice-07` | 0 | 所有玩家想出三個代表自己的標籤，並順時針逐一分享選擇的原因！ | **Label Yourself** - Everyone thinks of three words that represent them and takes turns sharing their reasons in a clockwise order! | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_07.jpg |
| `ice-08` | 0 | 所有玩家分享一句深刻影響你的話，並逐一分享！ | **Words That Stuck With You** - Share a quote or phrase that has deeply influenced you. | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_08.jpg |
| `ice-09` | 0 | 所有玩家分享平常你都是如何表達「愛」？ | **How Do You Show Love?** - Share how you usually express love in your daily life. | `all` | `all` | `none` | ✅ 成功辨識 | Verified from ice_09.jpg |
| `ice-10` | 0 | 所有玩家一起合照一張！並上傳打卡！ | **Group Selfie Time!** - Take a group photo together and post it! | `action` | `all` | `none` | ✅ 成功辨識 | Verified from ice_10.jpg |

### ★ 一星連結 (One-Star Connection) - 20 張

| 卡牌 ID | 星級 | 中文題目 | 英文內容 | 互動類型 | 回答規則 | 目標對象 | 辨識狀態 | 備註 |
|---|---|---|---|---|---|---|---|---|
| `one-01` | 1 | 邀請大家說說對你的第一印象？（由所有玩家回應抽卡人） | **First Impressions** - Everyone shares their first impression of the card-drawer! | `othersToDrawer` | `everyoneExceptDrawer` | `drawer` | ✅ 成功辨識 | Verified from one_01.jpg |
| `one-02` | 1 | 你認為最能讓你放鬆或療癒的事情是什麼？ | **Your Relaxation Ritual** - What helps you relax or feel at peace the most? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_02.jpg |
| `one-03` | 1 | 你覺得自己比較像外向還是內向的人？有沒有具體的例子？ | **Introvert or Extrovert?** - Do you see yourself as more introverted or extroverted? Share an example! | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_03.jpg |
| `one-04` | 1 | 請大家分享最想對你說的一句話，可能是感謝、稱讚或祝福。（由所有玩家回應抽卡人） | **Say Something Nice!** - Everyone shares a message for the card-drawer: a thank you, a compliment, or a blessing. | `othersToDrawer` | `everyoneExceptDrawer` | `drawer` | ✅ 成功辨識 | Verified from one_04.jpg |
| `one-05` | 1 | 如果可以跟任何一位名人一起吃飯，你會選誰？ | **Dinner with a Celebrity** - If you could have dinner with any celebrity, who would it be? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_05.jpg |
| `one-06` | 1 | 有沒有哪一本書或哪一部電影，讓你看完印象深刻？ | **Memorable Book or Movie** - Is there a book or movie that left a deep impression on you? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_06.jpg |
| `one-07` | 1 | 你想要在生活中融入什麼樣的新習慣？ | **New Habit to Adopt** - What new habit would you like to integrate into your life? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_07.jpg |
| `one-08` | 1 | 你覺得維持一段友誼最重要的元素是什麼？ | **Key to Lasting Friendships** - What do you think is the most important factor in maintaining a friendship? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_08.jpg |
| `one-09` | 1 | 你最喜歡收到什麼樣子的禮物？ | **Best Type of Gift** - What kind of gift do you love receiving the most? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_09.jpg |
| `one-10` | 1 | 關於童年，你最難忘的記憶是什麼？ | **Unforgettable Childhood Memory** - What's a childhood memory that has stayed with you? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_10.jpg |
| `one-11` | 1 | 如果你能瞬間掌握一種才藝，你會選什麼？ | **Instant Talent** - If you could instantly master a skill, what would it be? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_11.jpg |
| `one-12` | 1 | 如果能夠回到某個特定年齡，你會想回到幾歲？ | **Rewind Time** - If you could go back to a certain age, which one would you choose? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_12.jpg |
| `one-13` | 1 | 分享人生的第一份工作與心境，有什麼特別的回憶嗎？ | **First Job Experience** - What was your first job like? Any special memories? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_13.jpg |
| `one-14` | 1 | 工作或學習之餘，你最常做的休閒活動是什麼？ | **Go-To Hobby** - What's your favorite leisure activity outside of work or study? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_14.jpg |
| `one-15` | 1 | 分享一個最近讓你覺得好笑或開心的時刻。 | **A Funny or Happy Moment** - Share something that made you laugh or feel happy recently. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_15.jpg |
| `one-16` | 1 | 分享一個最近讓你感到幸運的事情。 | **A Lucky Moment** - Talk about something that made you feel lucky recently. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_16.jpg |
| `one-17` | 1 | 送大家你很喜歡的一句話，它如何影響你？ | **A Meaningful Quote** - Share a quote you love and how it has influenced you. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_17.jpg |
| `one-18` | 1 | 你覺得自己在社交中最大的優勢是什麼？ | **Your Social Superpower** - What's your biggest strength in social situations? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_18.jpg |
| `one-19` | 1 | 分享一份近期生活中得到的體悟？ | **Recent Life Lesson** - Share something valuable you've realized recently. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_19.jpg |
| `one-20` | 1 | 小時候最喜歡的一部卡通或動畫是什麼？ | **Favorite Childhood Cartoon/Anime** - What was your favorite cartoon or anime as a kid? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from one_20.jpg |

### ★★ 二星連結 (Two-Star Connection) - 20 張

| 卡牌 ID | 星級 | 中文題目 | 英文內容 | 互動類型 | 回答規則 | 目標對象 | 辨識狀態 | 備註 |
|---|---|---|---|---|---|---|---|---|
| `two-01` | 2 | 你最近一次對父母撒謊是什麼時候？是什麼事件？ | **Last Lie to Your Parents** - What was the last lie you told your parents and why? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_01.jpg |
| `two-02` | 2 | 什麼樣的行為最令你憤怒？你都如何表達憤怒？ | **What Makes You Angry?** - What behaviors upset you the most? How do you usually express anger? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_02.jpg |
| `two-03` | 2 | 你覺得自己身上最值得驕傲的特質是什麼？ | **Your Proudest Trait** - What's a personal trait you're most proud of? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_03.jpg |
| `two-04` | 2 | 最近有沒有誰說過一句話，或做過一件事，讓你覺得「他真的懂我」？ | **Feeling Understood** - Has someone recently said or done something that made you feel truly understood? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_04.jpg |
| `two-05` | 2 | 最近有沒有什麼時刻讓你紅了眼眶？ | **Last Time You Got Emotional** - When was the last time you teared up? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_05.jpg |
| `two-06` | 2 | 描述一次你克服恐懼的經歷，當時發生了什麼？ | **Overcoming Fear** - Share a time you faced and conquered a fear. What happened? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_06.jpg |
| `two-07` | 2 | 你認為一段理想的關係，需要具備哪些特質？為什麼？ | **Ideal Relationship Qualities** - What qualities do you think are essential for a great relationship? Why? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_07.jpg |
| `two-08` | 2 | 大家認為跟你有哪些相似之處呢？特質、個性或是談吐。（由所有的玩家回應抽卡人） | **What Do We Have in Common?** - What similarities do others see between you and them? (All players answer) | `othersToDrawer` | `everyoneExceptDrawer` | `drawer` | ✅ 成功辨識 | Verified from two_08.jpg |
| `two-09` | 2 | 對一位玩家說出你心中的感謝。記得給一個擁抱。 | **Show Gratitude** - Express gratitude to one player and don't forget to give them a hug! | `chooseOne` | `drawerChooses` | `chosenPlayer` | ✅ 成功辨識 | Verified from two_09.jpg |
| `two-10` | 2 | 分享一個現在生活中最喜歡的部分？他滿足了你內心什麼樣的需求？ | **Favorite Part of Life Right Now** - What do you love most about your life currently? How does it fulfill you? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_10.jpg |
| `two-11` | 2 | 你會如何表達關心或在乎？身邊的人都能收到嗎？ | **Showing You Care** - How do you express care and affection? Do people around you recognize it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_11.jpg |
| `two-12` | 2 | 你會如何形容在家庭中你所扮演的角色？家庭成員也是這樣看待你嗎？ | **Your Role in the Family** - How would you describe your role in the family? Do your family members see it the same way? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_12.jpg |
| `two-13` | 2 | 有沒有哪一次你覺得自己的感受與需求被重要的人忽視？當時你的反應是什麼？ | **Feeling Unheard** - Share a time when someone important to you ignored your feelings or needs. How did you react? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_13.jpg |
| `two-14` | 2 | 什麼事是你知道要改變，但總是告訴自己還有時間？ | **Something You Procrastinate** - What's something you know you should change but keep telling yourself there's still time? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_14.jpg |
| `two-15` | 2 | 有沒有哪件事當時讓你感到心碎，但現在回想起來已經可以微笑面對？ | **From Heartbreak to Smile** - Is there something that once broke your heart but now makes you smile? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_15.jpg |
| `two-16` | 2 | 如果不會被嘲笑或反對，你最想完成什麼事情？ | **No Judgment Dream** - If nobody judged or opposed you, what would you want to accomplish? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_16.jpg |
| `two-17` | 2 | 大家會如何向陌生人介紹我呢？（由所有玩家回應抽卡人） | **How Would Others Introduce You?** - How would the people here describe you to a stranger? (All players answer) | `othersToDrawer` | `everyoneExceptDrawer` | `drawer` | ✅ 成功辨識 | Verified from two_17.jpg |
| `two-18` | 2 | 描述一次你覺得自己被照亮的時刻（精確地說出你的特質與優點）？ | **A Moment You Felt Seen** - Describe a time when your strengths and qualities were truly recognized.and learn from? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_18.jpg |
| `two-19` | 2 | 嘉許在場某一人的行為、特質或是共同經歷的回憶。他對你產生了什麼影響？ | **Acknowledge Someone Here** - Praise someone for their qualities, actions, or shared memories. How have they impacted you? | `chooseOne` | `drawerChooses` | `chosenPlayer` | ✅ 成功辨識 | Verified from two_19.jpg |
| `two-20` | 2 | 你認為自己在哪些方面成長最多？它是否來自什麼關鍵事件或人物？ | **Personal Growth** - In what area have you grown the most? Was it inspired by a key event or person? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from two_20.jpg |

### ★★★ 三星連結 (Three-Star Connection) - 20 張

| 卡牌 ID | 星級 | 中文題目 | 英文內容 | 互動類型 | 回答規則 | 目標對象 | 辨識狀態 | 備註 |
|---|---|---|---|---|---|---|---|---|
| `three-01` | 3 | 面對壓力與挑戰時，你如何給予自己力量與信心？ | **Finding Strength Under Pressure** - How do you motivate and empower yourself during difficult times? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_01.jpg |
| `three-02` | 3 | 分享人際關係中你最想被珍惜的是什麼？你也珍惜跟你有相同特點的人嗎？ | **What You Value in Relationships** - What do you want to be appreciated for in your relationships? Do you also cherish those traits in others? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_02.jpg |
| `three-03` | 3 | 分享一個你印象深刻的失敗經歷，描述當初的感受，以及你現在如何看待它？ | **A Meaningful Failure** - Talk about a significant failure, how it felt then, and how you see it now. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_03.jpg |
| `three-04` | 3 | 想像一個完美的「療癒日」你會怎麼安排？哪些元素對你來說是最具療癒效果？ | **Your Perfect Healing Day** - What would an ideal self-care day look like for you? What elements make it truly healing? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_04.jpg |
| `three-05` | 3 | 分享生命中最讓你感到幸福的時刻？是什麼讓它如此特別？ | **Your Happiest Moment** - What's your happiest life moment? What made it special? How can you recreate it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_05.jpg |
| `three-06` | 3 | 如果現在有機會對一個人說出你的歉意或感謝，你會選誰？ | **An Apology or Gratitude Message** - If you could send one heartfelt message, who would it be for? Would you actually send it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_06.jpg |
| `three-07` | 3 | 分享一個你一直想做但至今都未完成的事情？如果選擇去完成它，該克服的挑戰是什麼？ | **A Dream Left Unfinished** - What's something you've always wanted to do but haven't yet? What's stopping you? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_07.jpg |
| `three-08` | 3 | 如果可以回到過去刪除某一個記憶，那會是什麼樣的事件？重來一次的話，你會怎麼做？ | **A Memory You'd Erase** - If you could delete one memory, what would it be? Would you do anything differently? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_08.jpg |
| `three-09` | 3 | 如果可以重塑與某人的關係，你最希望改變哪個部分？為什麼？ | **Rebuilding a Relationship** - If you could reshape your relationship with someone, what would you change and why? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_09.jpg |
| `three-10` | 3 | 分享一件你曾全力以赴達成的一件事，當時你有什麼心情？為了什麼而去努力？ | **Something You Gave Your All For** - Share an achievement you put your heart and soul into. How did you feel, and what drove you to succeed? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_10.jpg |
| `three-11` | 3 | 最近一次讓你感到內疚的事情是什麼？ | **A Recent Guilty Moment** - What's something you did recently that made you feel guilty? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_11.jpg |
| `three-12` | 3 | 在生命最後的時刻，你會最感謝自己做過哪個決定？ | **A Life-Changing Decision** - At the end of your life, what decision do you think you'll be most grateful for? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_12.jpg |
| `three-13` | 3 | 說出一個你在群體或關係中最令你驕傲的特質？你怎麼發現的？ | **Your Best Relationship Trait** - What quality makes you proud in social settings? How did you discover it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_13.jpg |
| `three-14` | 3 | 你曾經完成過的最有成就感的一件事是什麼？你是如何完成的？ | **Your Greatest Accomplishment** - What's something you achieved that made you feel truly proud? How did you do it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_14.jpg |
| `three-15` | 3 | 談一談你正在面對的人生課題，阻礙你的是什麼？你認為自己會怎麼突破？ | **Your Current Life Challenge** - What life challenge are you facing right now? What's holding you back, and how do you plan to overcome it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_15.jpg |
| `three-16` | 3 | 你覺得怎麼樣的經歷能讓人重新認識自己？分享一件關於你的人生轉折點。 | **Experiences That Redefine You** - What kind of experiences help people rediscover themselves? Share a turning point in your own life. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_16.jpg |
| `three-17` | 3 | 分享你與父母之間印象最深刻的一個回憶？ | **A Core Memory with Your Parents** - Share a deeply memorable moment with your parents. | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_17.jpg |
| `three-18` | 3 | 你曾經做過最勇敢的決定是什麼？分享一下當時的心境為何？ | **Your Bravest Decision** - What's the boldest decision you've ever made? How did you feel at that moment? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_18.jpg |
| `three-19` | 3 | 在家庭關係中你最想改變的是什麼？最需要克服的是什麼？ | **Family Dynamics** - What would you most like to change about your family relationships? What's the biggest challenge to overcome? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_19.jpg |
| `three-20` | 3 | 你認為過去一年裡，你最大的成長是什麼？ | **Your Biggest Growth in the Past Year** - What's the biggest way you've grown in the last year? How did you achieve it? | `single` | `drawer` | `none` | ✅ 成功辨識 | Verified from three_20.jpg |
