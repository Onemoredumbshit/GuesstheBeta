// Guess the Beta Game - Interactive Browser Game
class GuessBetaGame {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.currentBeta = 0;
        this.marketReturns = [];
        this.assetReturns = [];
        this.chart = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.newRound();
    }
    
    setupEventListeners() {
        const submitBtn = document.getElementById('submit-guess');
        const newRoundBtn = document.getElementById('new-round');
        const restartBtn = document.getElementById('restart-game');
        const guessInput = document.getElementById('beta-guess');
        
        submitBtn?.addEventListener('click', () => this.submitGuess());
        newRoundBtn?.addEventListener('click', () => this.newRound());
        restartBtn?.addEventListener('click', () => this.reset());
        guessInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });
    }
    
    // Generate synthetic daily returns with specified beta
    generateReturns(beta, numDays = 50) {
        const returns = { market: [], asset: [] };
        
        for (let i = 0; i < numDays; i++) {
            // Generate market return (normal distribution approximation)
            const marketReturn = this.normalRandom() * 0.02; // ~2% daily volatility
            
            // Generate asset return with beta relationship + idiosyncratic risk
            const idiosyncraticRisk = this.normalRandom() * 0.05; // ~0.5% idiosyncratic volatility
            const assetReturn = beta * marketReturn + idiosyncraticRisk;
            
            returns.market.push(marketReturn);
            returns.asset.push(assetReturn);
        }
        
        return returns;
    }
    
    // Box-Muller transform for normal distribution
    normalRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    
    // Calculate actual beta from returns using linear regression
    calculateBeta(marketReturns, assetReturns) {
        const n = marketReturns.length;
        const sumX = marketReturns.reduce((a, b) => a + b, 0);
        const sumY = assetReturns.reduce((a, b) => a + b, 0);
        const sumXY = marketReturns.reduce((sum, x, i) => sum + x * assetReturns[i], 0);
        const sumXX = marketReturns.reduce((sum, x) => sum + x * x, 0);
        
        const beta = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return beta;
    }
    
    // Create scatter plot using Chart.js
    createChart() {
        const ctx = document.getElementById('scatter-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        const data = this.marketReturns.map((market, i) => ({
            x: market * 100, // Convert to percentage
            y: this.assetReturns[i] * 100
        }));
        
        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Asset vs Market Returns',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Market Return (%)'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Asset Return (%)'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Market: ${context.parsed.x.toFixed(2)}%, Asset: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Start a new round
    newRound() {
        // Generate random beta between -2 and 3
        this.currentBeta = Math.random() * 4 - 2; // Range: -2 to 3
        
        // Generate returns
        const returns = this.generateReturns(this.currentBeta);
        this.marketReturns = returns.market;
        this.assetReturns = returns.asset;
        
        // Create chart
        this.createChart();
        
        // Reset UI
        const guessInput = document.getElementById('beta-guess');
        const feedback = document.getElementById('feedback');
        const submitBtn = document.getElementById('submit-guess');
        const newRoundBtn = document.getElementById('new-round');
        const restartBtn = document.getElementById('restart-game');
        
        if (guessInput) guessInput.value = '';
        if (feedback) feedback.textContent = '';
        if (submitBtn) submitBtn.disabled = false;
        if (newRoundBtn) newRoundBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'none';
        
        // Focus on input
        if (guessInput) guessInput.focus();
    }
    
    // Submit user's beta guess
    submitGuess() {
        const guessInput = document.getElementById('beta-guess');
        const feedback = document.getElementById('feedback');
        const submitBtn = document.getElementById('submit-guess');
        const newRoundBtn = document.getElementById('new-round');
        
        if (!guessInput || !feedback) return;
        
        const userGuess = parseFloat(guessInput.value);
        
        // Validate input
        if (isNaN(userGuess)) {
            feedback.textContent = 'Please enter a valid number!';
            feedback.className = 'feedback error';
            return;
        }
        
        // Calculate actual beta from the generated data
        const actualBeta = this.calculateBeta(this.marketReturns, this.assetReturns);
        const difference = Math.abs(userGuess - actualBeta);
        
        // Calculate score and update lives
        let points = 0;
        let message = '';
        let feedbackClass = 'feedback';
        
        if (difference <= 0.15) {
            points = 10;
            this.lives = Math.min(this.lives + 1, this.maxLives); // Add life, max 3
            message = '🎯 Perfect! ';
            feedbackClass += ' excellent';
        } else if (difference <= 0.3) {
            points = 5;
            message = '👍 Great! ';
            feedbackClass += ' good';
        } else if (difference <= 0.45) {
            points = 2;
            message = '👌 Good! ';
            feedbackClass += ' okay';
        } else if (difference <= 0.6) {
            points = 0;
            message = '😐 Close, but no points. ';
            feedbackClass += ' poor';
        } else {
            points = 0;
            this.lives--;
            message = '💥 Too far off! Lost a life. ';
            feedbackClass += ' terrible';
        }
        
        this.score += points;
        
        // Update feedback
        message += `Your guess: ${userGuess.toFixed(2)}, Actual: ${actualBeta.toFixed(2)}`;
        message += ` (±${difference.toFixed(2)})`;
        message += points > 0 ? ` +${points} points!` : '';
        
        feedback.textContent = message;
        feedback.className = feedbackClass;
        
        // Update UI
        this.updateUI();
        
        // Disable submit, show new round button
        if (submitBtn) submitBtn.disabled = true;
        if (newRoundBtn) newRoundBtn.style.display = 'inline-block';
        
        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    // Update UI elements
    updateUI() {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) {
            // Create heart icons for lives
            const hearts = '❤️'.repeat(this.lives) + '🖤'.repeat(this.maxLives - this.lives);
            livesEl.textContent = hearts;
        }
    }
    
    // Handle game over
    gameOver() {
        const feedback = document.getElementById('feedback');
        const submitBtn = document.getElementById('submit-guess');
        const newRoundBtn = document.getElementById('new-round');
        const restartBtn = document.getElementById('restart-game');
        const guessInput = document.getElementById('beta-guess');
        
        if (feedback) {
            feedback.textContent = `💀 Game Over! Final Score: ${this.score} points. Click restart to play again.`;
            feedback.className = 'feedback game-over';
        }
        
        // Disable game controls, show restart button
        if (submitBtn) submitBtn.disabled = true;
        if (newRoundBtn) newRoundBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'inline-block';
        if (guessInput) guessInput.disabled = true;
    }
    
    // Reset game (if needed)
    reset() {
        this.score = 0;
        this.lives = 3;
        const guessInput = document.getElementById('beta-guess');
        if (guessInput) guessInput.disabled = false;
        this.updateUI();
        this.newRound();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded! Please include Chart.js before this script.');
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = 'Error: Chart.js library not found. Please include Chart.js in your HTML.';
            feedback.className = 'feedback error';
        }
        return;
    }
    
    // Initialize the game
    window.guessBetaGame = new GuessBetaGame();
});

// Utility functions for external access
window.GuessBetaUtils = {
    // Get current game stats
    getGameStats() {
        if (window.guessBetaGame) {
            return {
                score: window.guessBetaGame.score,
                lives: window.guessBetaGame.lives,
                currentBeta: window.guessBetaGame.currentBeta
            };
        }
        return null;
    },
    
    // Reset the game
    resetGame() {
        if (window.guessBetaGame) {
            window.guessBetaGame.reset();
        }
    }
};