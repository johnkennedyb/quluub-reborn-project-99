import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const GenotypeSelect = ({
  inputs,
  handleChange,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Genotype: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.genotype ? inputs.genotype : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      placeholder="Genotype"
      value={inputs.genotype}
      name="genotype"
      onChange={(value) => {
        handleChange({
          target: {
            name: "genotype",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Genotype", disabled: true },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        ...["AA", "AS", "AC", "SS", "SC"].map((value) => ({
          value,
          label: value,
        })),
      ].filter((item) => !!item)}
    />
  );
};

export default GenotypeSelect;
