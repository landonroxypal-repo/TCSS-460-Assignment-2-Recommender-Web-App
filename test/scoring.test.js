/**
 * TCSS 460
 * 7/5/2026
 * Assignment 2
 *
 * scoring.test.js, Unit tests for scoring.js
 * using the in-built testing functionality of
 * 'node --test'.
 *
 * These tests were written with the help of AI,
 * but they should match the expected behavior of
 * the algorithm, which I implemented myself.
 *
 * @author Landon Wardle
 *
 * @version 1.0
 */

const test = require("node:test");
const assert = require("node:assert");
const { normalizeWeights, scoreGame, weightGames } = require("../src/scoring");

/*
 * Relative-tolerance check: safe for both very large and very small results,
 * since it scales the allowed error to the magnitude of the expected value
 * instead of using a fixed absolute cutoff.
 */
function assertCloseToRelative(actual, expected, relTolerance = 1e-9) {
    const diff = Math.abs(actual - expected);
    const scale = Math.max(Math.abs(expected), Number.EPSILON);
    assert.ok(
        diff <= relTolerance * scale,
        `expected ${actual} to be close to ${expected} (diff = ${diff}, allowed = ${relTolerance * scale})`
    );
}

/*
 * Helper to compare two weight OBJECTS within tolerance, since normalizeWeights
 * now returns { category: normalizedValue } instead of a plain array.
 */
function assertWeightsCloseTo(actual, expected) {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    assert.deepStrictEqual(actualKeys, expectedKeys);
    actualKeys.forEach(key => assertCloseToRelative(actual[key], expected[key]));
}

/*
 * Fixture: randomized 5-game dataset, category key order is
 * cost, story, gameplay, art, technical
 */
const GAMES = [
    {
        id: 1,
        name: "Nebula Drift",
        description: "A procedurally generated space exploration sandbox.",
        scores: { cost: 6, story: 4, gameplay: 9, art: 5, technical: 7 },
    },
    {
        id: 2,
        name: "Ironwood Keep",
        description: "A cooperative tower-defense RPG hybrid.",
        scores: { cost: 8, story: 6, gameplay: 4, art: 9, technical: 6 },
    },
    {
        id: 3,
        name: "Static Signal",
        description: "A narrative-driven horror puzzle game.",
        scores: { cost: 3, story: 10, gameplay: 6, art: 7, technical: 5 },
    },
    {
        id: 4,
        name: "Rustbelt Racing",
        description: "An arcade-style vehicular combat racer.",
        scores: { cost: 9, story: 1, gameplay: 8, art: 3, technical: 9 },
    },
    {
        id: 5,
        name: "Loom of Ages",
        description: "A turn-based strategy game set across parallel timelines.",
        scores: { cost: 5, story: 8, gameplay: 2, art: 10, technical: 4 },
    },
];

// ---------- normalizeWeights ----------
// Signature: normalizeWeights(weights) where weights is a
// key/value object like { cost: 5, story: 2, ... }, returning
// a same-shaped object whose values sum to 1.

test("normalizeWeights normalizes an object to values summing to 1", () => {
    const result = normalizeWeights({ cost: 5, story: 5, gameplay: 5, art: 5 });
    assert.deepStrictEqual(result, { cost: 0.25, story: 0.25, gameplay: 0.25, art: 0.25 });
});

test("normalizeWeights handles values that don't divide evenly", () => {
    const result = normalizeWeights({ cost: 1, story: 2, gameplay: 3 });
    const expected = { cost: 1 / 6, story: 2 / 6, gameplay: 3 / 6 };
    assertWeightsCloseTo(result, expected);
});

test("normalizeWeights handles all zeros", () => {
    const result = normalizeWeights({ cost: 0, story: 0, gameplay: 0 });
    assert.deepStrictEqual(result, { cost: 0, story: 0, gameplay: 0 });
});

test("normalizeWeights preserves all original keys", () => {
    const input = { cost: 7, story: 2, gameplay: 6, art: 6, technical: 9 };
    const result = normalizeWeights(input);
    assert.deepStrictEqual(Object.keys(result).sort(), Object.keys(input).sort());
});

test("normalizeWeights result values sum to 1", () => {
    const result = normalizeWeights({ cost: 3, story: 7, gameplay: 1, art: 9, technical: 4 });
    const total = Object.values(result).reduce((sum, v) => sum + v, 0);
    assertCloseToRelative(total, 1);
});

/*
 * scoreGame takes a normalized WEIGHTS OBJECT (keyed by category),
 * which is now exactly what normalizeWeights returns directly --
 * no manual array-to-object conversion needed in these tests.
 */

// ---------- scoreGame ----------

test("scoreGame computes weighted sum with normalized weights", () => {
    const game = GAMES[0]; // Nebula Drift: cost 6, story 4, gameplay 9, art 5, technical 7

    const rawWeights = { cost: 1, story: 1, gameplay: 10, art: 1, technical: 1 }; // heavily favors gameplay
    const weights = normalizeWeights(rawWeights);

    const expected =
        (6 / 10) * weights.cost +
        (4 / 10) * weights.story +
        (9 / 10) * weights.gameplay +
        (5 / 10) * weights.art +
        (7 / 10) * weights.technical;

    const score = scoreGame(game, weights, "weighted-sum");
    assertCloseToRelative(score, expected);
});

test("scoreGame computes weighted product with normalized weights", () => {
    const game = GAMES[0];

    const rawWeights = { cost: 1, story: 1, gameplay: 10, art: 1, technical: 1 };
    const weights = normalizeWeights(rawWeights);

    const expected =
        Math.pow(6 / 10, weights.cost) *
        Math.pow(4 / 10, weights.story) *
        Math.pow(9 / 10, weights.gameplay) *
        Math.pow(5 / 10, weights.art) *
        Math.pow(7 / 10, weights.technical);

    const score = scoreGame(game, weights, "weighted-product");
    assertCloseToRelative(score, expected);
});

test("scoreGame weighted product returns 0 if any score is 0", () => {
    const game = {
        id: 99,
        scores: { cost: 0, story: 5, gameplay: 5, art: 5, technical: 5 },
    };

    // Already normalized
    const weights = { cost: 0.2, story: 0.2, gameplay: 0.2, art: 0.2, technical: 0.2 };

    const score = scoreGame(game, weights, "weighted-product");
    assert.strictEqual(score, 0);
});

/*
 * Signature: weightGames(games, weights, method)
 * where `weights` is now a normalized OBJECT (the direct output of
 * normalizeWeights), keyed by category name -- no positional
 * alignment with Object.keys(game.scores) required anymore.
 */

// ---------- weightGames ----------

test("weightGames sorts descending by score (weighted-sum)", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 1, technical: 1 }; // equal weighting

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    for (let i = 0; i < ranked.length - 1; i++) {
        assert.ok(ranked[i].score >= ranked[i + 1].score);
    }
});

test("weightGames ranks games correctly when gameplay is heavily weighted (weighted-sum)", () => {
    // Raw weights heavily favor gameplay -> gameplay should dominate the score.
    const weights = { cost: 1, story: 1, gameplay: 10, art: 1, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    /*
     * Gameplay scores: Nebula Drift 9, Rustbelt Racing 8, Static Signal 6,
     * Ironwood Keep 4, Loom of Ages 2 -- all distinct, so with gameplay
     * weighted ~71% the order should track gameplay directly.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [1, 4, 3, 2, 5]
    );
});

test("weightGames ranks games correctly when cost is heavily weighted (weighted-sum)", () => {
    const weights = { cost: 10, story: 1, gameplay: 1, art: 1, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    /*
     * Cost scores: Rustbelt Racing 9, Ironwood Keep 8, Nebula Drift 6,
     * Loom of Ages 5, Static Signal 3 -- all distinct, so with cost
     * weighted ~71% order should track cost directly.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [4, 2, 1, 5, 3]
    );
});

test("weightGames ranks games correctly when story is heavily weighted (weighted-sum)", () => {
    const weights = { cost: 1, story: 10, gameplay: 1, art: 1, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    /*
     * Story scores: Static Signal 10, Loom of Ages 8, Ironwood Keep 6,
     * Nebula Drift 4, Rustbelt Racing 1 -- all distinct.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [3, 5, 2, 1, 4]
    );
});

test("weightGames ranks games correctly when art is heavily weighted (weighted-sum)", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 10, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    /*
     * Art scores: Loom of Ages 10, Ironwood Keep 9, Static Signal 7,
     * Nebula Drift 5, Rustbelt Racing 3 -- all distinct.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [5, 2, 3, 1, 4]
    );
});

test("weightGames ranks games correctly when gameplay is heavily weighted (weighted-product)", () => {
    const weights = { cost: 1, story: 1, gameplay: 10, art: 1, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-product");

    /*
     * With gameplay weighted ~71%, the (gameplay/10)^0.71 term dominates
     * each game's product since the remaining four terms are all raised
     * to small ~0.07 exponents. Order should track gameplay directly,
     * same as the weighted-sum case above.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [1, 4, 3, 2, 5]
    );
});

test("weightGames ranks games correctly when technical is heavily weighted (weighted-product)", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 1, technical: 10 };

    const ranked = weightGames(GAMES, weights, "weighted-product");

    /*
     * Technical scores: Rustbelt Racing 9, Nebula Drift 7, Ironwood Keep 6,
     * Static Signal 5, Loom of Ages 4 -- all distinct. With technical
     * weighted ~71%, order should track technical directly.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [4, 1, 2, 3, 5]
    );
});

test("weightGames ranks games correctly when art is heavily weighted (weighted-product)", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 10, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-product");

    /*
     * Art scores: Loom of Ages 10, Ironwood Keep 9, Static Signal 7,
     * Nebula Drift 5, Rustbelt Racing 3 -- same distinct ordering as
     * the weighted-sum art case above.
     */

    // Note: 2 ranks higher than 5 because of other categories dragging 5 down!
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [2, 5, 3, 1, 4]
    );
});

test("weightGames preserves same ranking logic for weighted-product", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 1, technical: 1 };

    const ranked = weightGames(GAMES, weights, "weighted-product");

    for (let i = 0; i < ranked.length - 1; i++) {
        assert.ok(ranked[i].score >= ranked[i + 1].score);
    }
});

test("weightGames returns all games with a score property attached", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 1, technical: 1 };
    const ranked = weightGames(GAMES, weights, "weighted-sum");

    assert.strictEqual(ranked.length, GAMES.length);
    ranked.forEach(g => {
        assert.strictEqual(typeof g.score, "number");
        assert.ok(!Number.isNaN(g.score));
    });
});

test("weightGames returns scores all bounded between 0 and 1", () => {
    const weights = { cost: 1, story: 1, gameplay: 1, art: 1, technical: 1 };
    const ranked = weightGames(GAMES, weights, "weighted-sum");

    ranked.forEach(g => {
        assert.ok(g.score >= 0 && g.score <= 1);
    });
});

test("weightGames ranks games correctly with mixed weights (weighted-sum)", () => {
    const weights = { cost: 5, story: 2, gameplay: 10, art: 5, technical: 8 };

    const ranked = weightGames(GAMES, weights, "weighted-sum");

    /*
     * Normalized weights: cost 0.1667, story 0.0667, gameplay 0.3333,
     * art 0.1667, technical 0.2667. Hand-computed weighted-sum scores:
     * Rustbelt Racing ~0.7133, Nebula Drift ~0.6967, Ironwood Keep ~0.6167,
     * Static Signal ~0.5667, Loom of Ages ~0.4767 -- gaps are all well
     * above floating-point tolerance, so this ordering should be stable.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [4, 1, 2, 3, 5]
    );
});

test("weightGames ranks games correctly with mixed weights (weighted-product)", () => {
    const weights = { cost: 5, story: 2, gameplay: 10, art: 5, technical: 8 };

    const ranked = weightGames(GAMES, weights, "weighted-product");

    /*
     * Note this order differs from the weighted-sum version of the same
     * weights ([4, 1, 2, 3, 5]) -- Nebula Drift and Rustbelt Racing swap
     * places. Rustbelt Racing's very weak story score (1/10) gets punished
     * disproportionately by the multiplicative model even at a small
     * ~6.7% weight, dragging it below Nebula Drift despite Rustbelt's
     * stronger cost, gameplay, and technical scores.
     */
    assert.deepStrictEqual(
        ranked.map(g => g.id),
        [1, 4, 2, 3, 5]
    );
});