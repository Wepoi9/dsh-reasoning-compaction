# DSH 推論ブロック自動展開 ＆ 自動コンパクション進捗表示 — パッチ配布

[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) のクライアントチャット UI に 2 つの機能を追加するパッチセットです。フォークではなく、パッチオーバーレイとして提供します。

### 追加機能
- **推論ブロックの自動展開**: 
  生成された回答に推論（reasoning）本文が含まれた際、最初の描画タイミングで自動的に展開します。一度手動で閉じた場合は、その後の生成においても閉じられた状態が維持されます。
  ※ 本機能を確認するには、モデル設定の `reasoningEffort` を `high` に設定してください（`none` や `minimal` では推論本文が出力されません）。
- **自動コンパクションの進捗表示**:
  自動コンパクションの実行状態を、表示専用の行（`running` / `failed`）として描画します。
  - **実行中 (`running`)**: ターンが開始され、チェックポイントや終了イベントが発生せず、セッションが稼働している場合に表示されます。
  - **失敗 (`failed`)**: チェックポイントなしで `compaction/end` エラーが発生した場合に表示されます。この行はセッション終了後も保持されます。
  - ※ `/compact` マーカーや Trajectory ビューの既存の挙動には影響しません。

### サポートバージョン
以下のタグ（コミット）に対応したパッチを提供しています。

- **dsh-v0.2.2-alpha.2** (commit `f3803c9697`)
- **dsh-v0.2.1-rc.2** (commit `687f282e86`)

#### 検証状況 (alpha.2)
`patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md` に詳細を記録しています。
- アーティファクトビルド、i18n、ビルドチェックなどのゲートをすべて通過。
- 特定の UI チャットテスト（311件）をすべて通過。
- ブラウザでの実機検証（2026-10-29）にて、自動展開、コンパクション進捗表示、リロード後の永続化などのユーザー向け機能が正常に動作することを確認済み。

### 適用方法

```sh
# パッチリポジトリと本体リポジトリをクローン
git clone --depth 1 https://github.com/Wepoi9/dsh-reasoning-compaction.git
git clone https://github.com/deepseek-ai/deepseek-harness.git

# 本体ディレクトリへ移動し、対象バージョンをチェックアウト
cd deepseek-harness
git checkout dsh-v0.2.2-alpha.2

# パッチの適用確認と実行
git apply --check ../dsh-reasoning-compaction/patches/dsh-v0.2.2-alpha.2.patch
git apply ../dsh-reasoning-compaction/patches/dsh-v0.2.2-alpha.2.patch
```
※ パッチファイルはこのリポジトリに保持されているため、`../dsh-reasoning-compaction/` などの相対パス指定が必要です。

### ビルドと実行
```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm dsh web
```
- **注意**: `pnpm@11.28.5` を使用しています。ワークスペース依存関係があるため、`npm install` ではなく `pnpm` を使用してください。
- **型チェック**: `pnpm run build` 後の `tsc -b tsconfig.client.json` で型チェックが可能です。

### ライセンス
MIT — 上流リポジトリと同様です。詳細は `LICENSE` を参照してください。
