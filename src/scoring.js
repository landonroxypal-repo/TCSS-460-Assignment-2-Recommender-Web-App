/**
 * TCSS 460
 * 7/5/2026
 * Assignment 2
 *
 * scoring.js, js module for the scoring functions.
 * All code written here is my own.
 *
 * @author Landon Wardle
 *
 * @version 1.0
 */

/**
 * Returns a rescaled weights object with all values normalized.
 *
 * @param weights An object of numbers to be normalized.
 * @returns Object
 */
function normalizeWeights(weights) {
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);

    const result = {};

    for (const [key, value] of Object.entries(weights)) {
        if (typeof value === "string") {
            throw new Error(`${key} is not a valid weight`);
        }

        if (value > 0) {
            result[key] = value / total;
        } else {
            result[key] = 0;
        }
    }

    return result;
}

/**
 * Scores a single game based on the provided method.
 *
 * @param game The game to score. Expects an object with a scores object with integers from 0 to 10.
 * @param weights A normalized object of weights received from the user.
 * @param method Either "weighted-sum" or "weighted-product." Defaults to "weighted-sum".
 *
 * @returns number
 */
function scoreGame(game, weights, method) {
    const scoreKeys = Object.keys(game.scores)

    if (method === "weighted-product") {
        return scoreKeys.reduce(
            (score, key) => score * Math.pow(game.scores[key] / 10, weights[key]), 1);
    } else {
        return scoreKeys.reduce(
            (score, key) => score + (game.scores[key] / 10) * weights[key], 0);
    }
}

/**
 * Weights an array of games based off the provided method, and returns the games in sorted order based off weighted score.
 *
 * @param games An Array of games to store.
 * @param weights An object of weights.
 * @param method Either "weighted-sum" or "weighted-product." Defaults to "weighted-sum".
 *
 * @return Array
 */
function weightGames(games, weights, method) {
    // Copy the original games array
    const result = [];

    // In JavaScript ellipses (...) creates a shallow copy.
    for (const game of games) {
        result.push({
            ...game,
            score: scoreGame(game, normalizeWeights(weights), method),
        });
    }

    result.sort((a, b) => b.score - a.score);

    // Alternatively I think you can oneline map this, but
    // it's not very readable, which is why I chose a for
    // loop instead with a sort call.

    return result;
}

module.exports = { normalizeWeights, scoreGame, weightGames };