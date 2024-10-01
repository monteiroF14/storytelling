import axios from "axios";

const API_URL = "http://localhost:3000";

async function fetchUserStorylines(userId: string) {
	const res = await axios.get(API_URL + "/");
	return res.data;
}
