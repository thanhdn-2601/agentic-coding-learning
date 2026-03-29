up: tools deps dev-env supabase-local sync-supabase-env

down: tools
	@npx supabase stop

dev:
	@yarn dev

tools:
	@command -v yarn >/dev/null 2>&1 || { echo "Error: yarn is not installed."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm is not installed."; exit 1; }
	@command -v npx >/dev/null 2>&1 || { echo "Error: npx is not installed."; exit 1; }

deps:
	@test -d node_modules || yarn install

dev-env:
	@if [ ! -f .env.development ]; then cp .env.example .env.development && echo "Created .env.development from .env.example"; fi
	@mkdir -p supabase/images
	@ln -fs .env.development .env
	@echo "Switched to local environment (.env -> .env.development)"

supabase-local:
	@npx supabase start
	@echo "Applying pending migrations..."
	@npx supabase db push --local 2>/dev/null || true

sync-supabase-env:
	@echo "Fetching Supabase local status..."
	@STATUS=$$(npx supabase status --output json 2>/dev/null) || { echo "Error: Supabase is not running. Run 'make up' first."; exit 1; }; \
	API_URL=$$(echo "$$STATUS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).API_URL))"); \
	PUBLISHABLE_KEY=$$(echo "$$STATUS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).PUBLISHABLE_KEY))"); \
	SECRET_KEY=$$(echo "$$STATUS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).SECRET_KEY))"); \
	sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$$API_URL|" .env.development; \
	sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$$PUBLISHABLE_KEY|" .env.development; \
	sed -i.bak "s|^SUPABASE_SECRET_KEY=.*|SUPABASE_SECRET_KEY=$$SECRET_KEY|" .env.development; \
	rm -f .env.development.bak; \
	echo "Updated .env.development:"; \
	echo "  NEXT_PUBLIC_SUPABASE_URL=$$API_URL"; \
	echo "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$$PUBLISHABLE_KEY"; \
	echo "  SUPABASE_SECRET_KEY=$$SECRET_KEY"

.PHONY: up down dev tools deps dev-env supabase-env
