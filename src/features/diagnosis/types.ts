export type DiagnosisRow = {
  id: string;
  icdCode: string;
  description: string;
  type: "primary" | "secondary";
  createdAt: Date;
  updatedAt: Date;
};

export type DiagnosticStatus = "active" | "resolved" | "inactive";
