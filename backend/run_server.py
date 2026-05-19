import os

import uvicorn

from backend.app.main import create_app


def run():
    port = int(os.getenv("MEDFLOW_PORT", "8765"))
    data_dir = os.getenv("MEDFLOW_DATA_DIR")
    app = create_app(data_dir=data_dir)
    uvicorn.run(app, host="127.0.0.1", port=port)


if __name__ == "__main__":
    run()
