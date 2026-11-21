// SHA-256 in plain JS: Hermes has no crypto.subtle and the app has no hashing library. Only used for the short
// Play Integrity request hash, so speed does not matter.
const K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
	0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
	0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
	0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
	0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
	0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
	0xc67178f2,
];

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export const sha256 = (data: number[]): number[] => {
	const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
	const msg = [...data, 0x80];
	while (msg.length % 64 !== 56) msg.push(0);
	const bits = data.length * 8; // inputs are tiny, so the high 32 bits of the length are 0
	for (let i = 7; i >= 0; i--) msg.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
	const w = new Array<number>(64);
	for (let o = 0; o < msg.length; o += 64) {
		for (let i = 0; i < 16; i++) {
			w[i] = (msg[o + 4 * i] << 24) | (msg[o + 4 * i + 1] << 16) | (msg[o + 4 * i + 2] << 8) | msg[o + 4 * i + 3];
		}
		for (let i = 16; i < 64; i++) {
			const a = w[i - 15];
			const b = w[i - 2];
			w[i] =
				(w[i - 16] +
					(rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) +
					w[i - 7] +
					(rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) |
				0;
		}
		let [a, b, c, d, e, f, g, x] = h;
		for (let i = 0; i < 64; i++) {
			const t1 = (x + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
			const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
			[x, g, f, e, d, c, b, a] = [g, f, e, (d + t1) | 0, c, b, a, (t1 + t2) | 0];
		}
		[a, b, c, d, e, f, g, x].forEach((v, i) => (h[i] = (h[i] + v) | 0));
	}
	return h.flatMap((v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
};

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const base64Url = (bytes: number[]) => {
	let out = "";
	for (let i = 0; i < bytes.length; i += 3) {
		const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
		const chars = Math.min(bytes.length - i, 3) + 1; // 1 byte -> 2 chars, 2 -> 3, 3 -> 4 (no padding)
		for (let j = 0; j < chars; j++) out += B64URL[(n >>> (18 - 6 * j)) & 63];
	}
	return out;
};

/** The Play Integrity requestHash the backend expects: base64url (no padding) of SHA-256("helphive-client-attest|" + deviceId). */
export const attestRequestHash = (deviceId: string) =>
	base64Url(sha256(Array.from(new TextEncoder().encode(`helphive-client-attest|${deviceId}`))));
