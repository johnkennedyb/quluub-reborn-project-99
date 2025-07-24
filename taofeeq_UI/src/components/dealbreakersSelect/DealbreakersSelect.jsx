import { Select, Tag, Typography } from "antd";

const DealbreakersSelect = ({ handleTagsChange, text = false, inputs }) => {
  return text ? (
    <>
      <Typography.Paragraph>Dealbreakers: </Typography.Paragraph>

      {inputs.dealbreakers && inputs.dealbreakers.length > 0 ? (
        inputs.dealbreakers.map((ice) => (
          <Tag key={ice} checked={true}>
            {ice}
          </Tag>
        ))
      ) : (
        <Typography.Text type="secondary">Not set</Typography.Text>
      )}
    </>
  ) : (
    <Select
      mode="tags"
      style={{
        width: "100%",
      }}
      placeholder="Add Dealbreakers"
      value={inputs.dealbreakers}
      onChange={(value) => handleTagsChange(value, "dealbreakers")}
    />
  );
};

export default DealbreakersSelect;
