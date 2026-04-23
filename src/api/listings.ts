import type { Listing } from "../types";


export async function getListings(
	search?: string,
	category?: string,
): Promise<Listing[]> {
	const params = new URLSearchParams();

	if (search) params.append("search", search);
	if (category) params.append("category", category);

	const query = params.toString();
	const url = query ? `/api/listings?${query}` : "/api/listings";

	const res = await fetch(url);
	if (!res.ok) throw new Error("Failed to fetch listings");
	return res.json();
}

export async function getListing(id: string): Promise<Listing> {
	const res = await fetch(`/api/listings/${id}`);
	if (!res.ok) throw new Error("Failed to fetch listing");
	return res.json();
}

export async function createListing(data: { 
	title: string;
	description: string;
	category: "tractor" | "combine" | "implement" | "attachment";
	startingPrice: number;
	imageUrl: string; 

}): Promise<Listing> {
	const res = await fetch("/api/listings", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || body.detail || "Failed to create listing");
	}
	return res.json();
}

export async function placeBid(
	listingId: string,
	bidder: string,
	amount: number,
): Promise<Listing> {
	const res = await fetch(`/api/listings/${listingId}/bids`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ bidder, amount }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || data.detail || "Failed to place bid");
	}
	return res.json();
}
export async function getBidHistory(listingId: string) {
	const res = await fetch(`/api/listings/${listingId}/bids`);

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || data.detail || "Failed to fetch bid history");
	}

	return res.json();
}
