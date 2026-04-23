import { useState } from "react";
import { createListing } from "../api/listings";
import type { Listing } from "../types";

interface Props {
	onSuccess: (listing: Listing) => void;
}

export default function CreateListingForm({ onSuccess }: Props) {
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const form = e.currentTarget;
		const data = new FormData(form);

		const title = (data.get("title") as string).trim();
		const description = (data.get("description") as string).trim();
		const category = data.get("category") as
			| "tractor"
			| "combine"
			| "implement"
			| "attachment";
		const startingPrice = parseFloat(data.get("startingPrice") as string);
		const imageUrl = (data.get("imageUrl") as string).trim();

		if (!title) {
			setError("Title is required.");
			return;
		}

		if (isNaN(startingPrice) || startingPrice < 0) {
			setError("Starting price must be 0 or greater.");
			return;
		}

		setSubmitting(true);
		try {
			const listing = await createListing({
				title,
				description,
				category,
				startingPrice,
				imageUrl,
			});
			onSuccess(listing);
			form.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create listing");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="bid-form" onSubmit={handleSubmit}>
			<h4 className="bid-form__title">New Listing</h4>
			{error && <div className="bid-form__error">{error}</div>}

			<div className="bid-form__field">
				<label htmlFor="title">Title</label>
				<input
					id="title"
					name="title"
					type="text"
					placeholder="e.g. 2018 John Deere 6120M"
					disabled={submitting}
				/>
			</div>

			<div className="bid-form__field">
				<label htmlFor="description">Description</label>
				<input
					id="description"
					name="description"
					type="text"
					placeholder="Short description"
					disabled={submitting}
				/>
			</div>

			<div className="bid-form__field">
				<label htmlFor="category">Category</label>
				<select id="category" name="category" disabled={submitting} defaultValue="implement">
					<option value="tractor">Tractor</option>
					<option value="combine">Combine</option>
					<option value="implement">Implement</option>
					<option value="attachment">Attachment</option>
				</select>
			</div>

			<div className="bid-form__field">
				<label htmlFor="startingPrice">Starting Price</label>
				<input
					id="startingPrice"
					name="startingPrice"
					type="number"
					min="0"
					step="1"
					placeholder="e.g. 50000"
					disabled={submitting}
				/>
			</div>

			<div className="bid-form__field">
				<label htmlFor="imageUrl">Image URL</label>
				<input
					id="imageUrl"
					name="imageUrl"
					type="text"
					placeholder="https://..."
					disabled={submitting}
				/>
			</div>

			<button
				type="submit"
				className="bid-form__submit"
				disabled={submitting}
			>
				{submitting ? "Creating…" : "Create Listing"}
			</button>
		</form>
	);
}