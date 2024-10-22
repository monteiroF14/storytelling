function formatTimeAgo(timestamp: number) {
	const now = new Date();
	const date = new Date(Number(timestamp) * 1000); // Ensure timestamp is a number
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	let interval = Math.floor(seconds / 31536000); // Years
	if (interval >= 1) {
		return interval === 1 ? "1 year ago" : `${interval} years ago`;
	}

	interval = Math.floor(seconds / 2592000); // Months
	if (interval >= 1) {
		return interval === 1 ? "1 month ago" : `${interval} months ago`;
	}

	interval = Math.floor(seconds / 604800); // Weeks
	if (interval >= 1) {
		return interval === 1 ? "1 week ago" : `${interval} weeks ago`;
	}

	interval = Math.floor(seconds / 86400); // Days
	if (interval >= 1) {
		return interval === 1 ? "1 day ago" : `${interval} days ago`;
	}

	interval = Math.floor(seconds / 3600); // Hours
	if (interval >= 1) {
		return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
	}

	interval = Math.floor(seconds / 60); // Minutes
	if (interval >= 1) {
		return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
	}

	return "Just now";
}

export { formatTimeAgo };
