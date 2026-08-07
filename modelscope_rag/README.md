# AIED Case Hub RAG Assistant

This folder contains the Gradio app for ModelScope Studio or ModelScope Notebook.

## Deploy on ModelScope Studio

1. Create a Gradio Studio app in ModelScope.
2. Upload `app.py` and `requirements.txt` from this folder.
3. Add these environment variables in Studio settings:
   - `MODELSCOPE_API_TOKEN`: your ModelScope access token
   - `MODELSCOPE_MODEL`: optional, defaults to `Qwen/Qwen3-30B-A3B-Instruct-2507`
   - `RAG_DATA_BASE_URL`: optional, defaults to `https://jojo-edtech.github.io/aiedcase/data`
   - `RAG_DAILY_GENERATION_LIMIT`: optional, defaults to `50`
4. Start the Studio app on CPU.
5. Copy the public Studio URL into `data/rag-config.json`.

Do not paste tokens into the GitHub Pages site, JavaScript files, or CSV files.

The public assistant is quota-limited. When the daily generation limit is exhausted, the app stops calling the model and returns retrieval citations only. The default 30B-A3B non-thinking model is substantially smaller than the previous 235B-A22B model and is better suited to short teacher-facing retrieval answers. Set `MODELSCOPE_MODEL` only when another ModelScope API-Inference model has been verified.

## Local check

```bash
python3 modelscope_rag/app.py --self-test
```

To run the Gradio app locally:

```bash
pip install -r modelscope_rag/requirements.txt
MODELSCOPE_API_TOKEN=... python3 modelscope_rag/app.py
```
