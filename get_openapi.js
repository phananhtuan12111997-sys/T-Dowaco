import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

async function fetchSchema() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const tasksDef = json.definitions.tasks;
    if (tasksDef) {
      console.log("Tasks columns:", Object.keys(tasksDef.properties));
    } else {
      console.log("No tasks definition found.");
    }
  } catch (err) {
    console.log("Fetch error:", err);
  }
}

fetchSchema();
