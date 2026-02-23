const supabaseUrl = 'https://wyedmvbwzwudalgxnnfs.supabase.co';
const supabaseKey = 'sb_publishable_9sy0Vfu0z3u9Eh7jrMoPNg_WLb-rFvP';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

window.supabaseClient = _supabase;
