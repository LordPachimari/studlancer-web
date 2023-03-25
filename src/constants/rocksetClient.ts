import rockset from "@rockset/client";
const apikey = process.env.ROCKSET_API_KEY;
const apiserver = "https://api.use1a1.rockset.com";
export const rocksetClient = rockset(apikey!, apiserver);
