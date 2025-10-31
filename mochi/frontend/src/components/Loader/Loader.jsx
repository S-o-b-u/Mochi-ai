import ContentLoader from "react-content-loader"

const MyLoader = (props) => (
  <ContentLoader 
    speed={2}
    width={800}
    height={124}
    viewBox="0 0 800 124"
    backgroundColor="#383838"
    foregroundColor="#42adff"
    {...props}
  >
    <rect x="0" y="0" rx="3" ry="3" width="800" height="15" /> 
    <rect x="0" y="25" rx="3" ry="3" width="700" height="15" /> 
    <rect x="0" y="50" rx="3" ry="3" width="578" height="15" />
  </ContentLoader>
)

export default MyLoader