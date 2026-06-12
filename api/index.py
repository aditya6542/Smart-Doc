# Vercel Serverless Function Bridge
import sys
import os

# Include parent directory in search path for main module imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
