// @flow
import React, { Component, Fragment } from 'react';
import styled from '@emotion/styled';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import type {
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from 'react-beautiful-dnd';

const Table:any = styled.table`
  width: 500px;
  margin: 0 auto;
  table-layout: ${(props: any) => props.layout};
`;

const TBody = styled.tbody`
  border: 0;
`;

const THead = styled.thead`
  border: 0;
  border-bottom: none;
  background-color: pink;
`;

const Row = styled.tr`
  ${(props: any) =>
    props.isDragging
      ? `
    background: pink;

    display: table;
  `
      : ''}/* stylelint-enable */;
`;

const Cell = styled.td`
  box-sizing: border-box;
  padding: 8px;

  /* locking the width of the cells */
  width: 50%;
`;

// class TableRow extends Component<any> {
//   render() {
//     const { snapshot, quote, provided } = this.props;
//     return (
//       <Row
//         ref={provided.innerRef}
//         isDragging={snapshot.isDragging}
//         {...provided.draggableProps}
//         {...provided.dragHandleProps}
//       >
//         <Cell>{quote.author.name}</Cell>
//         <Cell>{quote.content}</Cell>
//       </Row>
//     );
//   }
// }

const Header = styled.header`
  display: flex;
  flex-direction: column;
  width: 500px;
  margin: 0 auto;
  margin-bottom: 16px;
`;

/* stylelint-disable block-no-empty */
const LayoutControl = styled.div``;

const CopyTableButton = styled.button``;
/* stylelint-enable */
export default class TableApp extends Component<any, any> {
  // eslint-disable-next-line react/sort-comp
  tableRef: any;

  state: any = {
    quotes: [
      { id: '1', author:{ name: 123}, content: '1112'},
      { id: '2', author:{ name: 456}, content: '11341'},
      { id: '3', author:{ name: 789}, content: '1115'},
      { id: '4', author:{ name: 123}, content: '1116'},
    ],
    layout: 'fixed',
  };

  reorder = (list: any[], startIndex: number, endIndex: number): any[] => {
    console.log(list);
    
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
  
    return result;
  };

  onDragEnd = (result: any) => {
    console.log('111', result);
    
    // dropped outside the list
    if (
      !result.destination ||
      result.destination.index === result.source.index
    ) {
      return;
    }

    // no movement
    if (result.destination.index === result.source.index) {
      return;
    }

    const quotes = this.reorder(
      this.state.quotes,
      result.source.index,
      result.destination.index,
    );
    console.log('state', this.state);
      
    this.setState({
      quotes: [...quotes],
    });
  };

  toggleTableLayout = () => {
    this.setState({
      layout: this.state.layout === 'auto' ? 'fixed' : 'auto',
    });
  };

  copyTableToClipboard = () => {
    const tableRef: any = this.tableRef;
    if (tableRef == null) {
      return;
    }

    const range: Range = document.createRange();
    range.selectNode(tableRef);
    window.getSelection()?.addRange(range);

    const wasCopied: boolean = (() => {
      try {
        const result: boolean = document.execCommand('copy');
        return result;
      } catch (e) {
        return false;
      }
    })();

    // eslint-disable-next-line no-console
    console.log('was copied?', wasCopied);

    // clear selection
    window.getSelection()?.removeAllRanges();
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Fragment>
          <Header>
            <LayoutControl>
              Current layout: <code>{this.state.layout}</code>
              <button type="button" onClick={this.toggleTableLayout}>
                Toggle
              </button>
            </LayoutControl>
            <div>
              Copy table to clipboard:
              <CopyTableButton onClick={this.copyTableToClipboard}>
                Copy
              </CopyTableButton>
            </div>
          </Header>
          <Table layout={this.state.layout}>
            <THead>
              <tr>
                <th>Author</th>
                <th>Content</th>
              </tr>
            </THead>
            <Droppable droppableId="34324323期前">
              {(droppableProvided) => (
                <TBody
                  ref={(ref: any) => {
                    this.tableRef = ref;
                    droppableProvided.innerRef(ref);
                  }}
                  {...droppableProvided.droppableProps}
                >
                  {this.state.quotes.map((quote: any, index: number) => (
                    <Draggable
                      draggableId={`Draggable${index}`} // 必填的，不可重复
                      index={index}
                      key={quote.id}
                    >
                      {(
                        provided: any,
                        snapshot: any,
                      ) => (
                        // <TableRow
                        //   provided={provided}
                        //   snapshot={snapshot}
                        //   quote={quote}
                        // />
                        <Row
                          ref={provided.innerRef}
                          // isDragging
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Cell>{quote.author.name}</Cell>
                          <Cell>{quote.content}</Cell>
                        </Row>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </TBody>
              )}
            </Droppable>
          </Table>
        </Fragment>
      </DragDropContext>
    );
  }
}