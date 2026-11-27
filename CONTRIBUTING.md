# Maintain the atlas · 贡献指南

For a new record, supply the primary paper or release, the indexed preprint/release date, a mechanism, a measured result **with its comparison regime** if applicable, and one limitation. Add both English and Chinese. Check code/model attribution against the authors’ or releasing organization’s page. A repost is not an independent source.

新增条目请给出原始来源、日期、机制及边界。数值必须带模型、指标和对照条件；预印本、会议、期刊、社区文章和厂商发布应当区分。不同轮数若是分别训练的模型，不能写成同一检查点的推理扫参。

- [Works](data/works.mjs) are shared by the website and offline casebooks; [routes](data/routes.mjs) hold the six classification cues and playable examples. Assign the primary route by the comparison discussed in the record, not every feature of a model. [Frontier chapters](data/frontier.mjs) link to the existing work IDs and distinguish published findings from proposed tests.
- [Guides](docs/guide.en.md), [中文导读](docs/guide.zh.md) and both READMEs require editorial updates for changes to the synthesis. Avoid new evidence counts without reconciling [the ledger](EVIDENCE.md).
- Add original figures or explicit reuse permission and source attribution. Do not upload paper PDFs by default.

## Local preview and validation

The primary reader follows the [illustrated edition](survey/README.md). Keep source Markdown and its relative image paths intact. Edit the bilingual framing in [story.mjs](data/story.mjs); regenerate chapter HTML, the §7.3 per-model notes and the workbook search index using `python3 scripts/build_survey.py` (Python 3.9+, `markdown-it-py`, `beautifulsoup4`, `openpyxl`). `python3 scripts/build_survey.py --check` checks for drift. These packages are not browser dependencies. Retain the manifest and do not publish document identities or unlicensed original art.

From the repository root, with Node 20+ and Python 3:

```sh
node scripts/casebook.mjs
node scripts/check.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` or `http://127.0.0.1:8000/?lang=zh#lab/F`. The published site is static: no framework, analytics, external fonts, model inference or build-time secrets. GitHub Pages serves `main` at `/`.

## Reproduce the seed audit (optional)

Use the reviewed upstream revision in [EVIDENCE.md](EVIDENCE.md). `INPUT` is the supplied source directory containing the overview, `awesome_loop_transformer/`, `figures/` and `papers/`; `WORK` is a separate scratch directory. The complete original input set is not redistributed. The audit helper needs Python 3.9+, `pypdf` and `requests`; they are **not** site dependencies.

```sh
python3 scripts/audit.py inventory "$INPUT" "$WORK"
# Review extracted destinations. The next step makes public outbound GET requests.
python3 scripts/audit.py visit "$INPUT" "$WORK"
python3 scripts/audit.py publish "$INPUT" "$WORK"
```

The extractor deduplicates external strings and retains provenance. Do not substitute “content verified” for a transport result, retry access controls, or erase failed visits. Reconcile the counts and the cutoff when publishing another snapshot.
