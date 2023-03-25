import {
  PublishedQuest,
  Quest,
  TransactionQueue,
  UpdateTransaction,
} from "../../../types/main";
import { TEST_USER } from "../../../constants/TEST_USER";
import { questRouter } from "../routers/quest";

const questId = "quest1";
//Inside of mutation tests there are a lot of query calls, so we test both query and mutations in the same testing suite.
describe("testing quest mutations", () => {
  // test("create quest", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const expectedQuest: Quest = {
  //     id: expect.any(String),
  //     creatorId: TEST_USER.id,
  //     inTrash: false,
  //     published: false,
  //     createdAt: expect.any(String),
  //     version: 1,
  //   };
  //   const createQuestResult = await caller.createQuest({ id: questId });
  //   const questResult = await caller.workspaceQuest({
  //     id: questId,
  //   });
  //   // expect.assertions(1);
  //   expect(createQuestResult).toBe(true);
  //   expect(questResult).toMatchObject(expectedQuest);
  // });
  test("update quest attributes", async () => {
    const caller = questRouter.createCaller({
      user: TEST_USER,
    });
    const transactions: TransactionQueue = new Map([
      [
        questId,
        {
          transactions: [
            {
              id: questId,
              attribute: "title",
              value: "HI THERE",
            },
          ],
        },
      ],
    ]);
    const questExpected = {
      title: "HI THERE",
    };
    function replacer(key: string, value: any) {
      if (value instanceof Map) {
        return {
          dataType: "Map",
          value: Array.from(value.entries()), // or with spread: value: [...value]
        };
      } else {
        return value;
      }
    }
    const updateQuestAttributesResult = await caller.updateQuestAttributes({
      transactionsString: JSON.stringify(transactions, replacer),
    });
    // const questResult = await caller.workspaceQuest({ id: questId });
    expect(updateQuestAttributesResult).toBe(true);
    // expect(questResult).toMatchObject(questExpected);
  });
  // test("update quest content", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const questExpected = {
  //     content: "some content",
  //   };
  //   const updateQuestContentResult = await caller.updateQuestContent({
  //     id: questId,
  //     content: questExpected.content,
  //   });
  //   const updatedQuest = await caller.workspaceQuest({ id: questId });
  //   expect(updateQuestContentResult).toBe(true);
  //   expect(updatedQuest).toMatchObject(questExpected);
  // });
  // test("delete quest", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const deleteQuestResult = await caller.deleteQuest({ id: questId });
  //   const deletedQuest = await caller.workspaceQuest({ id: questId });
  //   expect(deleteQuestResult).toBe(true);
  //   expect(deletedQuest?.inTrash).toBe(true);
  // });
  // test("restore quest", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const restoreQuestResult = await caller.restoreQuest({ id: questId });
  //   const restoredQuest = await caller.workspaceQuest({ id: questId });
  //   console.log("restored", restoredQuest?.inTrash);
  //   expect(restoreQuestResult).toBe(true);
  //   expect(restoredQuest?.inTrash).toBe(false);
  // });
  // test("publish quest", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const questExpected = {
  //     published: true,
  //     publishedAt: expect.any(String),
  //     status: "OPEN",
  //     creatorProfile: "default profile",
  //   };
  //   const publishQuestResult = await caller.publishQuest({ id: questId });
  //   const publishedQuestResult = await caller.publishedQuest({ id: questId });
  //   expect(publishQuestResult).toBe(true);
  //   expect(publishedQuestResult.quest).toMatchObject(questExpected);
  // });
  // test("unpublish quest", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const unpublishQuestResult = await caller.unpublishQuest({ id: questId });
  //   const unpublishedQuestResult = await caller.workspaceQuest({ id: questId });
  //   const publishedQuestResult = await caller.publishedQuest({ id: questId });
  //   expect(unpublishQuestResult).toBe(true);
  //   expect(unpublishedQuestResult?.published).toBe(false);
  //   expect(publishedQuestResult).toBeNull;
  // });
  // test("delete quest permanently", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const deleteQuestResult = await caller.deleteQuestPermanently({
  //     id: questId,
  //   });
  //   const deletedQuest = await caller.workspaceQuest({ id: questId });
  //   expect(deleteQuestResult).toBe(true);
  //   expect(deletedQuest).toBeNull;
  // });
  // test("add quest solver", async () => {
  //   const caller = questRouter.createCaller({
  //     user: TEST_USER,
  //   });
  //   const addSolverResult = await caller.addSolver({ questId });
  //   const questResult = await caller.publishedQuest({ id: questId });
  //   console.log(questResult);
  //   expect(addSolverResult).toBe(true);
  //   expect(questResult.quest?.slots).toBe(4);
  //   expect(questResult.solvers.length > 0).toBe(true);
  // });
});
//before querying published quests make sure to comment out delete permanently/unpublish tests.
