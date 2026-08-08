# AIED Case Hub RAG Assistant

This folder contains the retrieval engine, the optional Gradio demo, and the
production JSON API used by the in-page assistant and teacher material tool.

The production API uses only the Python standard library. It indexes the case,
resource, and prompt CSV files, sends retrieved context to ModelScope
API-Inference, and returns structured JSON with source records.

## Production endpoints

Run the service locally without a token:

```bash
AIEDCASE_API_PORT=8792 RAG_DATA_BASE_URL=./data \
  python3 modelscope_rag/api_server.py
```

Endpoints:

- `GET /health`
- `POST /chat`
- `POST /teacher-tool`

The API applies an origin allowlist, body-size limit, per-IP sliding rate limit,
daily generation quota, safe response headers, and bounded conversation
history. It never returns or logs the ModelScope token.

Deployment templates are in `modelscope_rag/deploy/`:

- `aiedcase-api.service`: isolated systemd service running as `aiedcase`.
- `aiedcase-api.env.example`: environment variable template without secrets.
- `nginx-location.conf`: HTTPS reverse-proxy location.
- `nginx-static-location.conf`: static `/aiedcase/` mirror on the ECS IP.
- `nginx-ip-https.conf`: TLS directives for a short-lived IP certificate.
- `certbot-ip-renew.service` and `.timer`: twice-daily renewal checks.

Copy only the actual token to `/etc/aiedcase-api.env`, set the file mode to
`600`, and keep it out of shell arguments, GitHub, frontend code, CSV files,
logs, and documentation. The public frontend reads only `api_base` from
`data/rag-config.json`.

## Checks

```bash
python3 -m unittest modelscope_rag.test_api -v
python3 modelscope_rag/app.py --self-test
```

The tests cover all three libraries, structured source records, required
teacher-tool fields, and source retrieval. A real generation smoke test should
be made against the HTTPS proxy after the token is installed.

## Optional ModelScope Studio demo

## Deploy on ModelScope Studio

1. Create a Gradio Studio app in ModelScope.
2. Upload `app.py` and `requirements.txt` from this folder.
3. Add these environment variables in Studio settings:
   - `MODELSCOPE_API_TOKEN`: your ModelScope access token
   - `MODELSCOPE_MODEL`: optional, defaults to `Qwen/Qwen3-30B-A3B-Instruct-2507`
   - `RAG_DATA_BASE_URL`: optional, defaults to `https://jojo-edtech.github.io/aiedcase/data`
   - `RAG_DAILY_GENERATION_LIMIT`: optional, defaults to `50`
4. Start the Studio app on CPU.
5. Keep the public Studio URL in `data/rag-config.json` only as an optional
   diagnostic link. The production website uses `api_base`.

Do not paste tokens into the GitHub Pages site, JavaScript files, or CSV files.

The public assistant is quota-limited. When the daily generation limit is exhausted, the app stops calling the model and returns retrieval citations only. The default 30B-A3B non-thinking model is substantially smaller than the previous 235B-A22B model and is better suited to short teacher-facing retrieval answers. Set `MODELSCOPE_MODEL` only when another ModelScope API-Inference model has been verified.

To run the Gradio app locally:

```bash
pip install -r modelscope_rag/requirements.txt
MODELSCOPE_API_TOKEN=... python3 modelscope_rag/app.py
```
