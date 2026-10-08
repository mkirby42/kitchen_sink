import { describe, expect, it } from "vitest";
import {
  modalityDisplayLabel,
  modalityDisplayLabels,
} from "@/lib/tags/modality-display";

describe("modality display", () => {
  it("expands bare preset acronyms", () => {
    expect(modalityDisplayLabel("CBT")).toBe("Cognitive Behavioral Therapy (CBT)");
    expect(modalityDisplayLabel("DBT")).toBe("Dialectical Behavior Therapy (DBT)");
    expect(modalityDisplayLabel("EMDR")).toBe(
      "Eye Movement Desensitization and Reprocessing (EMDR)",
    );
    expect(modalityDisplayLabel("ACT")).toBe(
      "Acceptance and Commitment Therapy (ACT)",
    );
    expect(modalityDisplayLabel("cbt")).toBe("Cognitive Behavioral Therapy (CBT)");
    expect(modalityDisplayLabel("C.B.T.")).toBe(
      "Cognitive Behavioral Therapy (CBT)",
    );
  });

  it("expands other mapped short codes and leaves phrases", () => {
    expect(modalityDisplayLabel("IFS")).toBe("Internal Family Systems (IFS)");
    expect(modalityDisplayLabel("SFBT")).toBe(
      "Solution-Focused Brief Therapy (SFBT)",
    );
    expect(modalityDisplayLabel("Psychodynamic")).toBe("Psychodynamic");
    expect(modalityDisplayLabel("Somatic")).toBe("Somatic");
    expect(modalityDisplayLabel("Narrative")).toBe("Narrative");
    expect(modalityDisplayLabel("Attachment-Based")).toBe("Attachment-Based");
    expect(modalityDisplayLabel("Solution Focused Brief (SFBT)")).toBe(
      "Solution Focused Brief (SFBT)",
    );
    expect(modalityDisplayLabel("Emotionally Focused")).toBe(
      "Emotionally Focused",
    );
    expect(modalityDisplayLabel("Existential")).toBe("Existential");
    expect(modalityDisplayLabel("Strength-Based")).toBe("Strength-Based");
  });

  it("dedupes expanded labels", () => {
    expect(modalityDisplayLabels(["CBT", "cbt", "Narrative"])).toEqual([
      "Cognitive Behavioral Therapy (CBT)",
      "Narrative",
    ]);
  });
});
