# Runtime 部署備忘 (Batch 2)

新增 workflow（本機已建檔，未推 GitHub）：

- `.github/workflows/sn_radar.yml` — 每 15 分鐘 SN GraphQL opportunity scan
- `.github/workflows/whitelist_scan.yml` — 每 30 分鐘抓 SN bounty / Bountycaster / Algora / Polar / Layer3 listing endpoint

需配合 push 的腳本：
- `scripts/sn_opportunity_radar.mjs`（本專案 `scripts/` 下已存在；推 runtime 時複製）

## 推送步驟（手動執行時 Jeff/Claude 確認）

```bash
cd runtime
mkdir -p scripts
cp ../scripts/sn_opportunity_radar.mjs scripts/
git add .github/workflows/sn_radar.yml .github/workflows/whitelist_scan.yml scripts/sn_opportunity_radar.mjs DEPLOY_NOTES.md
git commit -m "Add SN radar + whitelist scan crons"
GH_PAT=$(security find-generic-password -s 'ClaudeEarnSelf-gh-pat' -a 'relayhop' -w)
git push https://$GH_PAT@github.com/relayhop/ClaudeEarnSelf-runtime.git main
unset GH_PAT
```

## 拉取結果到本機探索

```bash
# 在本專案 root
cd runtime && git pull --rebase && cd ..
ls runtime/data/opportunities/   # 最新 listing
ls runtime/data/sn_opportunities/  # SN radar 歷次
```

之後本機 `scripts/strategy_combinator.py`（Batch 3.2）可從這些 JSONL 抽取候選機會做 EV 排序。
