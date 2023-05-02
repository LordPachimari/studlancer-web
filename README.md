# Studlancer-web.

 This web-app uses NEXT.js, Dynamodb as a database, TRPC for server-client typesafety, Clerk for authentication, Chakra ui for UI, Supabase realtime for chat, Momento for cache, Zustand for state management, rockset for real-time data-analytics (like ElasticSearch but with real-time data ingestion).
 

- [Next.js](https://nextjs.org)
- [Clerk](https://clerk.com/)
- [Dynamodb](https://aws.amazon.com/dynamodb/)
- [Chakra ui](https://chakra-ui.com/)
- [tRPC](https://trpc.io)
- [Momento cache](https://www.gomomento.com/) 
- [zustand](https://github.com/pmndrs/zustand)
- [supabase](https://supabase.com/)

## Fetures done:
- [x] **Workspace functionality (all necessary CRUD)**. Implemented serverless functions (NEXT.js api routes) with TRPC to ensure typesafety between server and client. TRPC uses react-query under the hood which allows for query caching and invalidation.
- [x] **Local and remote cache**. Used serveless remote Momento cache for fetching published quests, and local cache to store non-published quests and solutions (created in the workspace).
- [x] **Authentication**. Utilized third-party clerk authentication.
- [x] **Global chat**. Used supabase realtime, with rate limiting and cron jobs that delete all the messages except last 100.
- [x] **Image upload  (needs more optimisation)**. Image upload to S3 bucket via NEXT.js api route. The max image size is 10MB. Image loading state is not added yet, multipart upload will be added in the future. 
- [x] **Global Search (for quests and users)**. Utilizing Rockset real-time data-analytics.
- [x] **Pagination.**
- [x] **Leaderboard**. Utilizing Rockset real-time data-analytics.

## In progress
- [ ] **Notifications**. Notifications will be stored in supabase tables,  every new table insertion of a notification will trigger an event that can be captured by supabase Realtime listeners, which will notify the clients that are subscribed to the updates on the table.
- [ ] **Payment**. Stripe for payment.
- [ ] **Private chat**. Supabase realtime. 
- [ ] **Guild**. UI and appropriate CRUD operations needs to be done.
- [ ] **Settings**. UI and appropriate CRUD operations needs to be done.
- [ ] **Real-time collaboration in the workspace with CRDT**.
- [ ] **Get rid of the loading states**. Make the website to be blazingly fast by caching all of the responses, and getting rid of loading states.

Looking **optimistically** in the future I may add the following:

- [ ] **AI in the workspace**.

