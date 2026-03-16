from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import random

app = FastAPI()

# This serves your HTML files
app.mount("/static", StaticFiles(directory="static"), name="static")

class SolveData(BaseModel):
    total_time: float
    splits: list[float] # [Cross, F2L, OLL, PLL]

@app.post("/analyze")
async def analyze_solve(data: SolveData):
    cross, f2l, oll, pll = data.splits
    
    # Simple Logic: Cross should be ~12% of the solve
    cross_ratio = (cross / data.total_time) * 100
    
    feedback = ""
    if cross_ratio > 15:
        feedback = "Your cross is taking up too much time. Try planning the full cross during inspection."
    elif f2l / data.total_time > 0.55:
        feedback = "Your F2L transitions are slow. Work on your look-ahead!"
    else:
        feedback = "Solid solve! Your efficiency ratios are within pro limits."

    return {"feedback": feedback}

@app.get("/scramble")
async def get_scramble():
    # In a real app, use a library or a pre-generated list
    moves = ["U", "D", "L", "R", "F", "B"]
    modifiers = ["", "'", "2"]
    scramble = " ".join([random.choice(moves) + random.choice(modifiers) for _ in range(20)])
    return {"scramble": scramble}
