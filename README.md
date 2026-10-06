# launcher
chromakey-launcher-v0.1
Digiterior Studio — founder + Claude
静的サイト(GitHub Pages)のままで動く、名前×色の記憶による認証と、その先のLauncher。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | 認証ゲート。名前を選び、文字ごとに記憶の色を選んで認証 |
| `launcher.html` | 認証後のランチャー。`data/services.json` からタイルを描画 |
| `js/auth-core.js` | 認証コア。PBKDF2-SHA256(WebCrypto)照合・セッション管理 |
| `data/users.json` | 利用者の記録(salt+ハッシュのみ。**正解の色は載らない**) |
| `data/services.json` | サービスタイルのINDEX(フラットファイル・RDBなし) |
| `tools/make-record.html` | 記録ジェネレータ — 自分のINDEXを作る(セルフサーブの種) |

## 設計原則

- **ソースに正解を書かない。** 照合は PBKDF2-SHA256 × 310,000回。記録は salt とハッシュのみ。
- **deliberately paced —「間」。** 認証応答には最短時間を設けている。速さは機能ではない。
- **フラットファイル + INDEX。** RDBなし。services.json の1行がタイル1枚。
- **緩くてレジリエンス。** 過剰設計しない。現実が確認したところだけ硬くする。

## 試し方

GitHub Pages にそのまま置けば動く。ローカルでは `python3 -m http.server` などHTTPサーバ経由で開く
(fetch を使うため file:// では動かない)。

デモ記録: 星野 晃一郎 — 星×深藍 `#1A237E`・晃×金 `#F9A825`(公開済みのデモ用アンカー。
実運用では利用者本人の私的な記憶を使う)。

## 正直な注記(v0.1の限界)

- 2文字×32色の鍵空間は約1,000通り — 公開リポジトリに users.json を置いた場合、
  オフライン総当たりは現実的に可能。**本番では文字数を増やす・フルHEX空間・配置(第五次元)を重ねる。**
- セッションは sessionStorage のみ(タブを閉じると消える)。
- レート制限は未実装(pacingはUX上の「間」であり、セキュリティ制御ではない)。

Love your life, love your time®
