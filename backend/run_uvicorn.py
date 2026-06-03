import sys
sys.path.insert(0, '/Users/mohitkumar/Desktop/Antigravity/Gemini/RetailCortex/backend/src')

import src.main as m
import uvicorn

if __name__ == '__main__':
    uvicorn.run(m.app, host='127.0.0.1', port=8000)
