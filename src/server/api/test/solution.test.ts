import {
  PublishedQuest,
  Quest,
  Solution,
  UpdateTransaction,
} from "../../../types/main";
import { TEST_USER } from "../../../constants/TEST_USER";
import { solutionRouter } from "../routers/solution";

const solutionId = "solution1";
const questId = "quest1";
describe("testing solution mutations", () => {
  test("create solution", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });
    const expectedSolution: Solution = {
      id: expect.any(String),
      creatorId: TEST_USER.id,
      inTrash: false,
      published: false,
      createdAt: expect.any(String),
      version: 1,
      type: "SOLUTION",
    };
    const createSolutionResult = await caller.createSolution({
      id: solutionId,
    });
    const solutionResult = await caller.workspaceSolution({
      id: solutionId,
    });
    // expect.assertions(1);
    expect(createSolutionResult).toBe(true);
    expect(solutionResult).toMatchObject(expectedSolution);
  });

  test("delete solution", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });

    const deleteSolutionResult = await caller.deleteSolution({
      id: solutionId,
    });
    const deletedSolution = await caller.workspaceSolution({ id: solutionId });
    expect(deleteSolutionResult).toBe(true);
    expect(deletedSolution?.inTrash).toBe(true);
  });
  test("restore solution", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });

    const restoreSolutionResult = await caller.restoreSolution({
      id: solutionId,
    });
    const restoredSolution = await caller.workspaceSolution({ id: solutionId });
    expect(restoreSolutionResult).toBe(true);
    expect(restoredSolution?.inTrash).toBe(false);
  });

  test("publish solution", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });

    const solutionExpected = {
      published: true,
      publishedAt: expect.any(String),
    };
    const publishSolutionResult = await caller.publishSolution({
      id: solutionId,
      questId,
      questCreatorId: "user1",
    });
    const publishedSolutionResult = await caller.publishedSolution({
      id: solutionId,
      questId,
    });
    expect(publishSolutionResult).toBe(true);
    expect(publishedSolutionResult).toMatchObject(solutionExpected);
  });
  test("unpublish solution", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });
    const unpublishSolutionResult = await caller.unpublishSolution({
      id: solutionId,
      questId,
    });
    const unpublishedSolution = await caller.workspaceSolution({
      id: solutionId,
    });
    const publishedSolution = await caller.publishedSolution({
      id: solutionId,
      questId,
    });
    expect(unpublishSolutionResult).toBe(true);
    expect(unpublishedSolution?.published).toBe(false);
    expect(publishedSolution).toBeNull;
  });
  test("delete solution permanently", async () => {
    const caller = solutionRouter.createCaller({
      user: TEST_USER,
    });

    const deleteSolutionResult = await caller.deleteSolutionPermanently({
      id: solutionId,
    });
    const deletedSolution = await caller.workspaceSolution({ id: solutionId });
    expect(deleteSolutionResult).toBe(true);
    expect(deletedSolution).toBeNull;
  });
});
