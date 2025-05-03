# AWS EB Advanced

## Getting Started

### Install Dependencies

```sh
npm install
```

### Start Server

```sh
DATABASE_URL=postgres://postgres:postgres@localhost:5432/study-sync PORT=4567 npm start
```

### Start Docker Container

```sh
docker-compose up -d
```

### Stop Docker Container

```sh
docker-compose down
```

### Connect to Database

```sh
docker exec -it study-sync-db-1 psql -U postgres
```

### Create Schema

```sh
psql study-sync < sql/schema.sql -h localhost -U postgres
```

### Seed Data

```sh
psql study-sync < sql/seed.sql -h localhost -U postgres
```

### Verify Data

```sh
psql study-sync -h localhost -U postgres -c "SELECT * FROM questions;"
```
