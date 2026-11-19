export type DetailView = "content" | "error" | "skeleton";

/**
 * Decides what a detail screen shows. It keys on "do we have a booking yet", never on a fetch being in progress, so a
 * cached or list-provided booking stays on screen while the query revalidates.
 *
 * - An HTTP error (403, 404, 409...) with no fresh data wins over a list-provided booking, since the server said no.
 * - A network error keeps whatever booking is already shown.
 */
export const getDetailView = ({
	booking,
	fresh,
	error,
}: {
	booking: unknown;
	fresh: unknown;
	error: unknown;
}): DetailView => {
	if (!fresh && typeof (error as any)?.status === "number") return "error";
	if (booking) return "content";
	return error ? "error" : "skeleton";
};
