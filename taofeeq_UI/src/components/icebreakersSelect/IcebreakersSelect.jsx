import { Select, Tag, Typography } from "antd";

const IcebreakersSelect = ({ handleTagsChange, text = false, inputs }) => {
  return text ? (
    <>
      <Typography.Paragraph>Icebreakers: </Typography.Paragraph>

      {inputs.icebreakers && inputs.icebreakers.length > 0 ? (
        inputs.icebreakers.map((ice) => (
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
      value={inputs.icebreakers}
      placeholder="Add Icebreakers"
      onChange={(value) => handleTagsChange(value, "icebreakers")}
    />
  );
};

export default IcebreakersSelect;
