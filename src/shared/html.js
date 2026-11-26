/**
 * Tagged template helper (`h`) binding `htm` to `React.createElement` for JSX-free template rendering.
 */
import {createElement} from "react";
import htm from "htm";
export const h=htm.bind(createElement);
