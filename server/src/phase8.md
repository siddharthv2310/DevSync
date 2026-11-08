Stage 1 — Database and architecture
[.] Finalize Task and related Prisma models
[.] Define enums, relations, constraints and indexes
[.] Prepare ER diagram
[.] Run Prisma migration

Stage 2 — Permissions
[.] Define task permissions
[.] Map permissions to project roles
[.] Implement authorization checks

Stage 3 — Core Task CRUD
[] Create task API
[ ] Get task details API
[ ] List project tasks API
[ ] Update task API
[ ] Delete task API

Stage 4 — Assignment
[ ] Assign users
[ ] Remove assignees
[ ] List assignees
[ ] Validate project membership

Stage 5 — Search and filtering
[ ] Pagination
[ ] Search
[ ] Status and priority filters
[ ] Assignee and date filters
[ ] Sorting and overdue filters

Stage 6 — Labels
[ ] Create and update labels
[ ] Delete labels
[ ] Assign and remove task labels

Stage 7 — Subtasks and dependencies
[ ] Create and manage subtasks
[ ] Prevent invalid nesting
[ ] Create and remove dependencies
[ ] Prevent dependency cycles

Stage 8 — Comments
[ ] Create comments
[ ] Edit and delete comments
[ ] Paginated comment listing
[ ] Mention support

Stage 9 — Attachments
[ ] Generate S3 upload URL
[ ] Complete upload
[ ] List and download attachments
[ ] Delete attachments and validate access

Stage 10 — Kanban Board
[ ] Create and manage boards
[ ] Create and manage columns
[ ] Retrieve board with tasks
[ ] Support configurable columns

Stage 11 — Movement and ordering
[ ] Move tasks between columns
[ ] Reorder tasks
[ ] Persist positions
[ ] Handle concurrent movement

Stage 12 — Integration and readiness
[ ] Verify authorization across modules
[ ] Verify data integrity and edge cases
[ ] Review query performance
[ ] Verify S3 and existing module integration
[ ] Complete API integration checks