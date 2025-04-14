import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables (optional inside Docker, but fine to keep)
load_dotenv()

if __name__ == "__main__":
    # Get host and port from environment or use defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    
    print(f"Starting server on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
