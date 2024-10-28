// import { describe, expect, it, mock } from "bun:test";
// import { StorylineService } from "../services/storyline-service";

// // Create a mock database object
// const mockDB = {
// 	createStoryline: vi.fn(),
// 	updateStoryline: vi.fn(),
// 	getStorylines: vi.fn(),
// };

// const storylineService = new StorylineService(mockDB);

// describe("Storyline Service", () => {
// 	it("should create a new storyline", async () => {
// 		const newStoryline = { title: "New Story", prompt: "Once upon a time..." };

// 		// Mock the database method
// 		mockDB.createStoryline.mockResolvedValueOnce({ id: 1, ...newStoryline });

// 		// Call the service method
// 		const result = await storylineService.create(newStoryline);

// 		// Assert that the service behaves as expected
// 		expect(result).toEqual({ id: 1, ...newStoryline });
// 		expect(mockDB.createStoryline).toHaveBeenCalledWith(newStoryline);
// 	});

// 	it("should update an existing storyline", async () => {
// 		const updatedData = { title: "Updated Story" };

// 		// Mock the database method
// 		mockDB.updateStoryline.mockResolvedValueOnce({
// 			id: 1,
// 			title: "Updated Story",
// 		});

// 		// Call the service method
// 		const result = await storylineService.update(1, updatedData);

// 		// Assert that the service behaves as expected
// 		expect(result.title).toBe("Updated Story");
// 		expect(mockDB.updateStoryline).toHaveBeenCalledWith(1, updatedData);
// 	});

// 	it("should fetch all storylines", async () => {
// 		const mockStorylines = [{ id: 1, title: "Storyline 1" }];

// 		// Mock the database method
// 		mockDB.getStorylines.mockResolvedValueOnce(mockStorylines);

// 		// Call the service method
// 		const result = await storylineService.getUserStorylines();

// 		// Assert that the service behaves as expected
// 		expect(result).toHaveLength(1);
// 		expect(result[0].title).toBe("Storyline 1");
// 		expect(mockDB.getStorylines).toHaveBeenCalled();
// 	});
// });
