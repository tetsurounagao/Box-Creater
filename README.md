# 梱包箱 3D プレビュー

梱包箱（直方体カートン）のデザイン確認用 Web アプリ。

- **左画面**: 十字（クルス）展開図エディタ。天板 / 底板 / 前面 / 背面 / 左右側面の 6 パネル ＋ フラップ（組立アンカー）を描画。各辺の長さはドラッグハンドルまたは数値入力（mm）で変更でき、対になるパネルが追従する。パネルをクリックして画像をアップロードし、面のアスペクト比に固定したトリミングモーダルで調整する。
- **右画面**: 3D プレビュー。左で設定した画像を各面に貼り、ドラッグで回転。紙質感（弱いクリアコート＋シーン）とローカル環境光で軽いツヤを表現。面ボタンで正面ビューへスムーズにカメラ遷移。
  - **シンプル / 部屋** をトグルで切替。
  - シンプル: 背景色をカラーピッカー（プリセット＋カスタム）で変更可能。
  - 部屋: 生活感のある室内シーン（板張りテーブル／床・ラグ・幅木・窓＋レースカーテン＋採光・観葉植物・フロアランプ・額装アート・壁掛け時計・本の山・マグカップ）。太陽光＋窓の面光源＋ランプの点光源＋半球光の多灯ライティングとソフトシャドウ。テーブル天面の決まった位置に箱を実寸配置し、置いたときの見え方・スケール感を確認できる（配置は固定）。
- **展開図の書き出し（印刷用ダイライン）**: 左ペインの「展開図を書き出し」から PNG / JPEG / PDF。原寸 100%・細線で、**実線＝切る／破線＝折る**の型紙。印刷して切り抜き・折りすれば箱の形が作れる。PNG・JPEG は約 300dpi ラスタ（日本語ラベル）、PDF はベクター（mm 実寸ページ、ラベルは ASCII）。面に画像を設定していれば校正用に貼り込まれる。jspdf / svg2pdf.js はクリック時に動的読み込み。

## 技術スタック

Vite ＋ React ＋ TypeScript / three.js ＋ @react-three/fiber ＋ drei / zustand / react-easy-crop

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド → dist/
npm run preview  # dist/ をローカル確認
```

## デプロイ（Vercel）

1. このディレクトリを Git リポジトリにして GitHub へ push。
2. Vercel で New Project → リポジトリを import。framework preset は **Vite** が自動検出される（build: `npm run build` / output: `dist`）。
3. Deploy。以降は push ごとに本番・プレビューが自動デプロイされる。

CLI の場合はこのディレクトリで `npx vercel` を実行。クライアントルーティングの無い単一ページのため `vercel.json` は不要。

## 構成メモ

- `src/lib/faces.ts` — 面 ID / ラベル / 法線 / BoxGeometry マテリアル並び / 面アスペクト
- `src/lib/geometry.ts` — W/D/H から展開図パネル・フラップ・折り線・寸法ハンドルを構築
- `src/lib/cropToCanvas.ts` — 画像＋クロップ矩形 → 面アスペクトの canvas（中央クロップのフォールバック付き）
- `src/hooks/useFaceCanvases.ts` — 面ごとの切り抜き canvas / dataURL を派生（SVG と 3D 両方に供給）
- `src/store/boxStore.ts` — 寸法・各面の画像/クロップ状態・プレビューモード・背景色と操作
- `src/components/right/Room.tsx` — 室内シーン一式＋ライティング（実寸 1 単位 = 1m。テーブル天面 `TABLE_TOP_Y` の `TABLE_CENTER_Z` に箱を配置）
- `src/components/right/roomTextures.ts` — 木目・織地・壁の手続き的テクスチャ生成
- `src/components/right/PreviewToolbar.tsx` — モード切替トグル ＋ 背景色ピッカー
- `src/lib/exportNet.ts` — 展開図 SVG 生成 ＋ PNG/JPEG ラスタライズ ＋ ベクター PDF 化 ＋ ダウンロード
- `src/components/left/NetExportMenu.tsx` — 書き出しボタン群
