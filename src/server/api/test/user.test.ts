// import { TEST_USER } from "../../../constants/TEST_USER";
// import { TopicsType } from "../../../types/main";
// import { userRouter } from "../routers/user";

// describe("testing user mutation procudure", () => {
//   test("create user", async () => {
//     const caller = userRouter.createCaller({
//       user: TEST_USER,
//     });
//     const expectedUserResult = {
//       id: TEST_USER.id,
//       balance: 0,
//       experience: 0,
//       profile: "default profile",
//       level: 0,
//       role: "USER",
//       username: TEST_USER.username,
//       verified: false,
//       type: "USER",
//     };

//     const createUserResult = await caller.createUser({
//       username: TEST_USER.username,
//     });
//     const userResult = await caller.userById({ id: TEST_USER.id });

//     expect(createUserResult).toBeTruthy();
//     expect(userResult).toMatchObject(expectedUserResult);
//   });
//   test("update user attributes", async () => {
//     const caller = userRouter.createCaller({
//       user: TEST_USER,
//     });
//     const expectedUser = {
//       username: "Jojo",
//       about: "I am Jorno Jovanna, and I have a dream",
//       topics: ["PROGRAMMING", "BUSINESS"] as TopicsType[],
//     };
//     const updateUserAttributesResult = await caller.updateUserAttributes({
//       username: expectedUser.username,
//       about: expectedUser.about,
//       topics: expectedUser.topics,
//     });
//     const userResult = await caller.userById({ id: TEST_USER.id });
//     expect(updateUserAttributesResult).toBe(true);
//     expect(userResult).toMatchObject(expectedUser);
//   });
// });
