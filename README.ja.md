# DSH 推論ブロック自動展開 ＆ 自動コンパクション進捗表示 — パッチ配布

[English](README.md) | 日本語

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

**DSH 0.2.2-rc.1 にパッチは不要です。** タグ `dsh-v0.2.2-rc.1`（commit `66491b05e3`）以降は上流本体が両機能を実装しているため、このオーバーレイは適用できない。`git apply --check` はすべての hunk で失敗し、rc.1 向けパッチは公開しない。rc.1 の `ReasoningRow.tsx` は生成中の推論ブロックを本文を含む最初の描画で自動展開し、手動で閉じれば以降は閉じたまま。`conversation-nodes/compaction.ts` は表示専用の `running` / `failed`（`CompactionProgressNode`）を同じ条件で組み立てる。ファイル・行番号の証拠と実際のコマンド出力は [`patches/evidence/RC1-NATIVE.md`](patches/evidence/RC1-NATIVE.md) に記録した。

#### 検証状況 (alpha.2)
`patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md` に詳細を記録しています。
- アーティファクトビルド、i18n、ビルドチェックなどのゲートをすべて通過。
- 特定の UI チャットテスト（311件）をすべて通過。
- **検証の制約**: より広範なGUIテストとブラウザ再現試験は未通過です。なお、一部の失敗は未変更の上流版でも再現しており、パッチ適用版の実ブラウザ動作確認は成功しています。
- ブラウザでの実機検証（2026-10-29）にて、自動展開、コンパクション進捗表示、リロード後の永続化などのユーザー向け機能が正常に動作することを確認済み。

#### 検証状況 (rc.2)
`patches/evidence/VERIFICATION.md` は rc.2 の検証記録で、alpha.2 の結果は含まない。rc.2 の web-e2e で失敗した項目はホスト環境側（WebKit 実行ファイルの欠如、shared skills catalog が slash menu の候補と永続 replay snapshot に混入する、Windows の区切り文字が golden に現れる、1 件の replayed stream タイムアウト）であり、UI の回帰ではない。hero first-prompt spec は rc.2 lane で通過した。

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

`dsh-v0.2.2-rc.1` 以降では適用するものはない。これらのビルドは両機能をすでに持っており、上記パッチは意図通り適用できない。

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
