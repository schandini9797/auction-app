import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express, { type Request, type Response } from "express";

const PORT = 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Types
// ============================================================

type Category = "tractor" | "combine" | "implement" | "attachment";
type Status = "active" | "closed" | "pending";

interface Bid {
	bidder: string;
	amount: number;
	timestamp: string;
}
interface Listing {
	id: string;
	title: string;
	description: string;
	category: Category;
	startingPrice: number;
	currentBid: number;
	currentBidder: string | null;
	status: Status;
	endsAt: string;
	imageUrl: string;
	bidHistory?: Bid[];
}

interface BidRequest {
	bidder: string;
	amount: number;
}

interface CreateListingRequest {
	title: string;
	description: string;
	category: Category;
	startingPrice: number;
	imageUrl: string;
}

// ============================================================
// In-memory store — seeded from data/listings.json
// ============================================================

const listings: Listing[] = JSON.parse(
	readFileSync(join(__dirname, "data", "listings.json"), "utf-8"),
);

// ============================================================
// App
// ============================================================

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// GET /api/listings
app.get("/api/listings", (_req: Request, res: Response) => {
	res.json(listings);
});

// POST /api/listings
app.post("/api/listings", (req: Request, res: Response) => {
	const { 
		title,
		description,
		category,
		startingPrice,
		imageUrl, 

	} = req.body as CreateListingRequest;

	if (!title || typeof title !== "string" || title.trim() === "") {
		return res.status(400).json({ error: "Title is required" });
	}
	const safeStartingPrice =
		typeof startingPrice === "number" && !isNaN(startingPrice) && startingPrice >= 0
			? startingPrice
			: 0;

	const listing: Listing = {
		id: randomUUID(),
		title: title.trim(),
		description:
			typeof description === "string" ? description.trim() : "",
		category:
			category === "tractor" ||
			category === "combine" ||
			category === "implement" ||
			category === "attachment"
				? category
				: "implement",
		startingPrice: safeStartingPrice,
		currentBid: safeStartingPrice,
		currentBidder: null,
		status: "active",
		endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : "",
		bidHistory: [],
	};

	listings.push(listing);
	return res.status(201).json(listing);
});

// GET /api/listings/:id
app.get("/api/listings/:id", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);
	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}
	return res.json(listing);
});

// POST /api/listings/:id/bids
app.post("/api/listings/:id/bids", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);
	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}

	if (listing.status !== "active") {
		return res
			.status(400)
			.json({ error: "This listing is not currently active" });
	}

	const bid = req.body as BidRequest;

	if (
		!bid.bidder ||
		typeof bid.bidder !== "string" ||
		bid.bidder.trim() === ""
	) {
		return res.status(400).json({ error: "Bidder name is required" });
	}

	if (typeof bid.amount !== "number" || isNaN(bid.amount) || bid.amount <= 0) {
		return res
			.status(400)
			.json({ error: "Bid amount must be a positive number" });
	}

	if (bid.amount <= listing.currentBid) {
		return res.status(400).json({
			error: `Bid must be greater than the current bid of $${listing.currentBid.toLocaleString()}`,
		});
	}
	const newBid = {
		bidder: bid.bidder.trim(),
		amount: bid.amount,
		timestamp: new Date().toISOString(),
	};

	if (!listing.bidHistory) {
		listing.bidHistory = [];
	}

	listing.bidHistory.push(newBid);

	listing.currentBid = bid.amount;
	listing.currentBidder = bid.bidder.trim();

	return res.status(200).json(listing);
});
// GET /api/listings/:id/bids
app.get("/api/listings/:id/bids", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);

	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}

	return res.json((listing.bidHistory || []).slice().reverse());
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
