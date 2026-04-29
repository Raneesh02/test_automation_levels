// COMPONENT TEST — One service, all dependencies mocked.
// What this catches: wiring bugs inside trackingService —
//   wrong repo method called, wrong args, missing orchestration step.
// What this misses: real DB constraints, real HTTP behavior.

import * as trackingRepository from "../../src/repositories/trackingRepository";
import { createTracking } from "../../src/services/trackingService";
import { TrackingRecord } from "@prisma/client";

jest.mock("../../src/repositories/trackingRepository");

const mockedRepo = jest.mocked(trackingRepository);

const FAKE_RECORD: TrackingRecord = {
  id: "record-uuid-1",
  orderId: "order-uuid-1",
  status: "PENDING",
  latitude: null,
  longitude: null,
  note: null,
  createdAt: new Date(),
};

beforeEach(() => { jest.clearAllMocks(); });

describe("createTracking", () => {
  it("calls repo.createRecord with PENDING status for the given orderId", async () => {
    mockedRepo.createRecord.mockResolvedValue(FAKE_RECORD);

    await createTracking("order-uuid-1");

    // service must pass status=PENDING — this is the contract order-service relies on
    expect(mockedRepo.createRecord).toHaveBeenCalledWith({
      orderId: "order-uuid-1",
      status: "PENDING",
    });
  });
});
