________________________________________
⭐ MASTERY GEMS – FINAL MASTER SPEC (V1 + Marketing Layer)
________________________________________
I. TẦM NHÌN SẢN PHẨM
MASTERY GEMS là trò chơi PvRoom cạnh tranh đông người (10–100 players), cơ chế Rock–Paper–Scissors nâng cấp với commit–reveal, stake bằng USDC gameplay nhanh – minh bạch – dễ viral.
Kết hợp:
•	GameFi
•	Marketing referral
•	NFT boost
•	MG Points ecosystem (loyalty + airdrop + gamification)
•	Social/KOL partnership funnel
________________________________________
II. TÍNH NĂNG CỐT LÕI CỦA GAME
1. Loại Room
Public Room
•	Ai cũng join
•	Stake cố định: 1 USDC
•	Min = 10, Max = 100
•	Auto-start 30s khi đủ Min
Creator / VIP Room
Chỉ ví KOL + NFT Holder + Whitelist được tạo:
Loại Room	Stake	Min	Max
Creator1	1 USDC	10	100
Creator5	5 USDC	8	30
Creator10	10 USDC	6	20
________________________________________
2. Gameplay
Trong mỗi room có số người random tùy theo số user đang Online để ghép cặp, Vì vậy trong mỗi game sẽ có những vòng lượt người chơi lẻ ( Lucky users) – Lucky users này sẽ được may mắn xếp thắng tại vòng loại và vào trạng thái chờ vòng tiếp theo. User sở hữu NFT sẽ tăng 10% trở thành lucky users mỗi vòng
Best-of-3 (vòng loại)
Best-of-5 (vòng chung kết / special event)
Điểm mỗi round:
•	Win = 5
•	Lose = 0
•	Draw (5 lần trở lên):
o	Người MG Points cao hơn → 1.5
o	Người thấp hơn → 1
Anti-Cheat
Commit → Reveal → Auto Random → Auto Lock
Replay Round
Replay tối đa 5 lần khi gặp lỗi backend.
________________________________________
3. Payout
•	Top 1 → 50% pool
•	Top 2 → 30%
•	Top 3 → 5%
•	Top 4 → 5%
•	Fee dev → 10%
________________________________________
4. Token được hỗ trợ
•	USDC Solana
•	USDC Monad
•	Hỗ trợ multi-chain join + settle ở Monad
________________________________________
III. MARKETING LAYER – USER PROFILE SYSTEM (NEW)
ĐÂY LÀ BỔ SUNG QUAN TRỌNG & CHÍNH THỨC thuộc core system:
________________________________________
1. User Profile
Mỗi user có hồ sơ cá nhân gồm:
•	Ví liên kết (Sol + Monad)
•	Username
•	Avatar
•	Tổng số trận
•	Winrate
•	Tổng MG Points
•	NFT sở hữu
•	Token hệ thống họ hold
•	Referral Code (auto generate)
•	Social (Twitter/X, Discord, Telegram)
________________________________________
2. Referral System (tự tạo khi liên kết ví)
•	User có referral link:
/ref/<address>
•	Người mời nhận:
o	MG Points
o	% nhỏ fee hoặc phần thưởng event
o	Cấp bậc referral leaderboard (phase 2)
________________________________________
3. Social Connect – KOL Program
Liên kết với các mạng:
•	Twitter/X API
•	Discord
•	Telegram
•	TikTok (optional)
Mục tiêu:
•	Nhận diện KOL
•	Gắn role “Creator Room Access”
•	Lên whitelist tự động
•	Tích hợp campaign theo đối tác
________________________________________
IV. MG POINTS SYSTEM (NEW)
1. MG Points dùng để làm gì?
•	Tính điểm tie-break khi hòa quá 5 lần.
•	Dùng cho airdrop future token.
•	D dùng để claim thưởng phụ, mở rương, vật phẩm.
•	Dùng làm chỉ số leaderboard (song song với winrate).
•	Dùng trong loyalty system & đối tác.
________________________________________
2. Cách nhận MG Points
Hoạt động	MG Points
Thắng trận	+3
Thắng Top1 BO3/BO5	+10
Referral active	+5
Giữ NFT hệ thống	boost +5% – 30%
Giữ token hệ thống	+X% theo tier
Event KOL	+10–100
Hoàn thành daily mission	+1–5
________________________________________
3. NFT Boost Rule (NEW)
Nếu user giữ NFT hệ thống → họ có:
+10% khả năng được chọn làm user may mắn
→ pass vòng loại để lên vòng tiếp theo (tính khi phòng quá tải).
•	Chỉ backend xử lý
•	Không nằm trên contract
•	Tính theo tỷ lệ:
base_chance = 1 / total_players
if user.hasNFT:
   chance = base_chance * 1.1
________________________________________
4. Top1 Bonus Reward (NEW)
User Top1 sẽ nhận:
•	USDC payout
•	Random MG Chest
o	50–100 điểm MG
o	hoặc item / NFT event
Backend chịu trách nhiệm random & gửi kết quả đến user.
________________________________________
5. Claim System (NEW)
User có thể claim MG Points theo:
•	NFT họ sở hữu
•	Số lượng token hệ thống họ nắm giữ
•	Partner NFT/Token
•	Campaign Marketing
________________________________________
V. PHÂN CHIA GIAI ĐOẠN (NEW)
Giai đoạn 1 – MVP Functional Core (tối giản nhưng chạy được)
Chỉ tập trung vào:
•	Backend room + round engine
•	Commit–reveal
•	Payout
•	Smart contract cơ bản
•	UI lobby + battle
•	Chạy testnet + test load nhỏ
Không bao gồm MG Points, user profile, referral, NFT logic.
→ Mục tiêu: Hoạt động mượt – ổn định – không bug – chơi thật được.
________________________________________
Giai đoạn 2 – Growth Layer / Marketing Layer
Thêm các tính năng mở rộng:
•	User Profile Page
•	Referral System
•	Social Connect
•	MG Points System
•	NFT Boost
•	Claim System
•	Leaderboard full
•	Creator room event boost
•	Cross-chain dashboard
•	BD / Partner Integrations
→ Mục tiêu: tăng trưởng người dùng & kích hoạt đối tác.
________________________________________
VI. TỔNG KẾT KIẾN TRÚC HỆ THỐNG (UPDATED)
Frontend (Next.js)
  ↓ REST API
Backend (Fastify)
  - Room Engine (GĐ1)
  - Game Engine (GĐ1)
  - Chain Adapter (GĐ1)
  - User Profile (GĐ2)
  - Social Connect (GĐ2)
  - MG Points Engine (GĐ2)
  - NFT Boost Logic (GĐ2)
  ↓
Smart Contract (MoneyGameRooms.sol)
  - createRoom
  - joinRoom
  - settleGame
  - payout
  ↓
USDC Token (Solana + Monad)
________________________________________
VII. PHÂN BỔ TASK FULL – THEO MODULE (FINAL)
________________________________________
🔵 GIAI ĐOẠN 1 (MVP CORE)
Backend (GĐ1)
•	Core Fastify server
•	Room manager (public + creator)
•	Creator room stake 1/5/10
•	Join/Leave room
•	Commit–reveal logic
•	Random AFK logic
•	Replay logic
•	Point system
•	Ranking engine
•	settleGame() call
•	Handle token USDC Sol + USDC Monad
Frontend (GĐ1)
•	Lobby public
•	Lobby VIP
•	Battle page commit/reveal
•	Countdown timers
•	Result summary
•	Wallet connect (Sol + Monad)
•	Join room UI + transaction flow
Smart Contract (GĐ1)
•	Room struct
•	Stake 1/5/10
•	joinRoom (transferFrom)
•	settleGame
•	payout 50/30/5/5
•	fee 10% dev
•	event emit
•	deploy testnet
________________________________________
🔵 GIAI ĐOẠN 2 (Marketing Growth Layer)
Backend (GĐ2)
•	User profile model
•	Authentication wallet
•	Referral generator
•	Social connect API
•	MG Points engine
•	Claim logic
•	NFT Boost logic
•	Lucky user progression logic
•	Top1 bonus chest generator
•	Partner/NFT/Token integration module
Frontend (GĐ2)
•	Profile page
•	Referral dashboard
•	Social link UI
•	MG Points dashboard
•	Claim UI
•	NFT inventory
•	Chest reward animation
Smart Contract (GĐ2) (nếu cần)
•	Optional NFT reward
•	Optional MG Point ledger (off-chain recommended)
•	Optional staking module
________________________________________
VIII. CHECKLIST CUỐI CÙNG – MỨC SẢN PHẨM
Sản phẩm cuối V1 (GĐ1) phải đạt:
•	Public room 100 người hoạt động
•	Creator room 1–5–10 USDC
•	Commit–reveal chạy mượt
•	Payout đúng 100%
•	Wallet connect chạy
•	Game real-time ổn định 300–500 user test
Sản phẩm cuối V2 (GĐ2) phải đạt:
•	User Profile hoàn chỉnh
•	Referral Viral Loop
•	MG Points hệ sinh thái
•	NFT Boost + Claim system
•	Phần thưởng Top1
•	Social Onboarding
•	Tích hợp KOL/partner
•	Dashboard lớn cho marketing & BD



 
monadmoneygame/
  backend/
    src/
      server.ts
      routes/
        rooms.ts
        game.ts
      core/
        roomManager.ts
        gameEngine.ts
      types/
        room.ts
        game.ts
    package.json
    tsconfig.json

  frontend/
    app/
      layout.tsx
      page.tsx
      lobby/
        page.tsx
      battle/
        [id]/
          page.tsx
    lib/
      api.ts
      types.ts
      config.ts
    package.json
    next.config.mjs
    tsconfig.json

  contracts/
    contracts/
      MoneyGameRooms.sol
    hardhat.config.ts
    package.json
    tsconfig.json
 
C. SƠ ĐỒ KIẾN TRÚC CHUYÊN NGHIỆP (DRAW.IO STYLE)
Bạn có thể copy cấu trúc dưới vào draw.io / diagrams.net để vẽ.
C.1. Level 1 – System Overview
Nodes (hình chữ nhật):
1.	User
2.	Frontend (Next.js)
3.	Backend (Fastify)
4.	Smart Contract (MoneyGameRooms)
5.	USDC Token (Monad/Solana)
Edges:
•	User → Frontend: “HTTP(S), Wallet Connect, UI”
•	Frontend → Backend: “REST API /rooms, /commit, /reveal”
•	Backend → Smart Contract: “joinRoom, settleGame”
•	Smart Contract → USDC: “transferFrom, transfer”
•	Backend → User (qua Frontend): “Game state, ranking, payout info”
________________________________________
C.2. Backend Internal Architecture
Nodes:
•	Fastify Server
•	RoomsRoutes
•	RoomManager
•	GameEngine
•	MonadClient (Chain Adapter)
•	Config/ENV
Edges:
•	Fastify Server → RoomsRoutes: “register”
•	RoomsRoutes → RoomManager: “listRooms, createRoom, joinRoom, getRoomState”
•	RoomsRoutes → GameEngine: “commitMove, revealMove, finalizeRound, getGame”
•	RoomsRoutes → MonadClient: “joinRoomTx, settleGameTx (GĐ2)”
•	MonadClient → Smart Contract
________________________________________
C.3. Frontend Architecture
Nodes:
•	Next.js App
•	Lobby Page
•	Battle Page
•	lib/api.ts
•	Wallet Connector (tương lai)
•	Backend API
Edges:
•	Lobby Page → api.getRooms → Backend /rooms
•	Battle Page → api.getRoomState → Backend /rooms/:id/state
•	Battle Page → api.commitMove → Backend /rooms/:id/commit
•	Battle Page → api.revealMove → Backend /rooms/:id/reveal
________________________________________
C.4. Contract Data Model
Nodes:
•	MoneyGameRooms contract
•	GameRoom struct
•	Player struct
•	USDC Token
•	Dev Wallet
Edges:
•	MoneyGameRooms → GameRoom: rooms[roomId]
•	GameRoom → Player[]: players
•	joinRoom → USDC.transferFrom(player, contract)
•	settleGame → USDC.transfer(player, amount)
•	settleGame → USDC.transfer(devWallet, fee)
________________________________________
D. SPRINT PLAN CALENDAR 14–21 NGÀY
Giả định:
•	Team: 1 BE, 1 FE, 1 SC, 1 PM
•	Sprint: 3 sprint × 1 tuần (7 ngày), tổng 21 ngày
Sprint 1 (Ngày 1–7): Skeleton & Flow Cơ Bản
Goal: chạy được:
•	Backend /health, /rooms (mock)
•	Frontend /lobby, /battle/:id hiển thị state mock
•	Contract compile + test cơ bản
Backend:
•	[S1-BE1] Setup Fastify + TypeScript + tsconfig
•	[S1-BE2] Implement /health
•	[S1-BE3] Implement RoomManager + listRooms, createPublicRoom
•	[S1-BE4] Implement /rooms GET + /rooms/:id/state mock
Frontend:
•	[S1-FE1] Setup Next.js App Router
•	[S1-FE2] Trang / + /lobby đọc list rooms mock
•	[S1-FE3] Trang /battle/[id] hiển thị room state mock
Smart Contract:
•	[S1-SC1] Setup Hardhat
•	[S1-SC2] Viết MoneyGameRooms skeleton: createRoom, joinRoom, mapping rooms
•	[S1-SC3] Test joinRoom + events cơ bản
Definition of Done S1:
•	npm run dev backend ok
•	npm run dev frontend, lobby & battle load được mock
•	npx hardhat test chạy test joinRoom pass
________________________________________
Sprint 2 (Ngày 8–14): Gameplay (commit–reveal) + Tính điểm
Goal:
•	Commit–reveal chạy được
•	GameEngine tính điểm đơn giản
•	Battle UI có commit/reveal và hiển thị state
Backend:
•	[S2-BE1] Implement GameEngine (commitMove, revealMove, finalizeRound)
•	[S2-BE2] Thêm API:
o	POST /rooms/:id/commit
o	POST /rooms/:id/reveal
o	POST /rooms/:id/finalize-round
•	[S2-BE3] Gắn GameEngine với RoomManager ở /rooms/:id/state
Frontend:
•	[S2-FE1] Hook commit/reveal từ Battle Page
•	[S2-FE2] Hiển thị JSON game state (debug)
•	[S2-FE3] UX cơ bản: chọn move, tạo salt, commit, reveal
Smart Contract:
•	[S2-SC1] Hoàn thiện settleGame payout 50/30/5/5 + fee 10%
•	[S2-SC2] Unit test payout với 4 player
Definition of Done S2:
•	Có thể chạy 1 room local, commit/reveal từ UI, backend tính điểm đơn giản
•	Contract settleGame test pass
________________________________________
Sprint 3 (Ngày 15–21): Room Types + Stake + Kết nối contract (testnet)
Goal:
•	Creator Room 1/5/10 USDC
•	joinRoom kết nối contract (ít nhất ở layer BE → contract)
•	Flow end-to-end cơ bản (user mock → pool → payout testnet)
Backend:
•	[S3-BE1] Thêm createCreatorRoom + API /rooms/create
•	[S3-BE2] Thêm stake 1/5/10 vào room state
•	[S3-BE3] Thêm MonadClient skeleton (chỉ giả lập / hoặc real testnet)
•	[S3-BE4] Gắn joinRoom backend với contract.joinRoom (mock tx hash nếu cần)
Frontend:
•	[S3-FE1] UI tạo Creator Room (chọn stake 1/5/10)
•	[S3-FE2] Hiển thị stake & loại room trong lobby
•	[S3-FE3] Chuẩn bị chỗ để sau này gắn wallet connect (GĐ2)
Smart Contract:
•	[S3-SC1] Deploy contract lên testnet Monad
•	[S3-SC2] Cập nhật địa chỉ contract và USDC vào ENV backend
•	[S3-SC3] Test manual: gọi joinRoom + settleGame bằng script
Definition of Done S3:
•	Từ UI có thể:
o	Xem room
o	Tạo Creator Room (mock user)
o	Join room (ít nhất gọi được BE → contract joinRoom mock/real)
o	Chạy commit–reveal đơn giản và manual settleGame (bằng script)


