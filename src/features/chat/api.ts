// Chat endpoints (scratch/chat/chat-contract.md). The server issues the CometChat token and decides who may talk.
import { apiSlice } from "@/services/api/apiSlice";

export interface ChatSession {
	provider: "cometchat";
	appId: string;
	region: string;
	uid: string;
	authToken: string;
	issued: boolean;
}

export interface ChatContact {
	uid: string;
	firstName?: string;
	lastName?: string;
	profile?: string;
	avatar?: string;
	role?: string;
	/** When the chat closes if nothing changes; null while a booking is active. */
	until: string | null;
	bookingIds: string[];
}

export type ReportCategory = "harassment" | "spam" | "inappropriate" | "safety" | "fraud" | "other";

/** A failed chat request: HTTP status (or RTK's FETCH_ERROR), the server's code and message, Retry-After seconds. */
export interface ChatApiError {
	status: number | string;
	data?: { message?: string; code?: string };
	retryAfter?: number;
}

const withRetryAfter = (
	response: { status: number | string; data?: unknown },
	meta: { response?: Response } | undefined,
): ChatApiError => {
	const header = Number(meta?.response?.headers.get("Retry-After"));
	return {
		status: response.status,
		data: response.data as ChatApiError["data"],
		retryAfter: Number.isFinite(header) && header > 0 ? header : undefined,
	};
};

const api = apiSlice.enhanceEndpoints({ addTagTypes: ["ChatContacts", "ChatBlocks"] });

export const chatApi = api.injectEndpoints({
	endpoints: (builder) => ({
		createChatSession: builder.mutation<{ chat: ChatSession }, void>({
			query: () => ({ url: "chat/session", method: "POST" }),
			transformErrorResponse: withRetryAfter,
		}),
		getChatContacts: builder.query<{ contacts: ChatContact[] }, void>({
			query: () => "chat/contacts",
			providesTags: ["ChatContacts"],
		}),
		setChatViewing: builder.mutation<unknown, { withUid: string | null }>({
			query: (body) => ({ url: "chat/viewing", method: "PUT", body }),
		}),
		getChatBlocks: builder.query<{ blocked: { uid: string; at: string }[] }, void>({
			query: () => "chat/blocks",
			providesTags: ["ChatBlocks"],
		}),
		blockChatUser: builder.mutation<unknown, { uid: string }>({
			query: (body) => ({ url: "chat/blocks", method: "POST", body }),
			invalidatesTags: ["ChatBlocks"],
		}),
		unblockChatUser: builder.mutation<unknown, { uid: string }>({
			query: ({ uid }) => ({ url: `chat/blocks/${encodeURIComponent(uid)}`, method: "DELETE" }),
			invalidatesTags: ["ChatBlocks"],
		}),
		reportChatUser: builder.mutation<
			{ report: { _id: string; status: string }; duplicate?: boolean },
			{ reportedUid: string; category: ReportCategory; details?: string; messageId?: string }
		>({
			query: (body) => ({ url: "chat/reports", method: "POST", body }),
		}),
	}),
});

export const {
	useGetChatContactsQuery,
	useGetChatBlocksQuery,
	useBlockChatUserMutation,
	useUnblockChatUserMutation,
	useReportChatUserMutation,
} = chatApi;
