 [ ] Add a small management dashboard (shadcn for the frontend) where I can inspect Accounts, and manage Brain account resources, called brain-admin.omattic.com
 [ ] Allow the dashboard to resolve Accounts and members from Account using their emails
 [ ] Add an authentication layer using ../auth-omattic-com and require a JWT for using any admin API endpoint
 [ ] Also allow each Account to have different Meta accounts registered to it, so that this system can work for many accounts simultaneously.
 [ ] Adapt the current database schema to support this new multi-account system
 [ ] In the Brain account-resource admin, we should be able to set the Meta env variables and secrets, WhatsApp, and every variable or secret that the components need, and store it in a D1 Database and cache it in a KV store so it is fast for the processes to access this information (many KVs already exist)
 [ ] Show a Monitoring section where we should be able to see the "failed" webhook events in one place and be able to examine them and re-process specific events or all failed events attached to a specific account 
