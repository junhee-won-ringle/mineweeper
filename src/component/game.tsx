import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateArr, incrementMines, decrementMines,
  incrementAnswers, decrementAnswers, switchResult, Square
} from "../app/gameSlice";
import { RootState } from "../app/store";
import classnames from 'classnames';
import '../App.scss'

export default function Game() {
  const dispatch = useDispatch();
  const result = useSelector((state: RootState) => state.game.result)
  const answers = useSelector((state: RootState) => state.game.answers)
  const boolNewGame = useSelector((state: RootState) => state.game.boolNewGame)
  const startMines = useSelector((state: RootState) => state.game.startMines)
  const arr = useSelector((state: RootState) => state.game.arr)
  const rows = useSelector((state: RootState) => state.game.rows)
  const columns = useSelector((state: RootState) => state.game.columns)

  const totalSquare: number = columns * rows;

  // 주위 8방향 배열
  const dir: Array<Array<number>> = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1]
  ];

  // 게임 처음 시작 시 기본 설정
  useEffect(() => {
    dispatch(switchResult(0));

    /**
     * 지뢰 위치
     * 2차원이 아닌 1차원으로 랜덤 추출 뒤, 2차원 변환
     */
    const temp: Array<number> = [];
    for (let i: number = 0; i < startMines; i++) {
      let num: number = Math.floor(Math.random() * totalSquare);
      if (temp.indexOf(num) === -1) {
        temp.push(num);

        // 중복 처리
      } else {
        i--;
      }
    }

    // 지뢰 표시
    const cp: Array<Array<Square>> = JSON.parse(JSON.stringify(arr));
    temp.map((num: number) => {
      let r: number = Math.floor(num / columns);
      let c: number = num % columns;
      cp[r][c].mine = -1;
    })

    // 주위 지뢰 개수 카운트
    cp.map((row: Array<object>, rowIndex: number) => {
      row.map((obj: object, columnIndex: number) => {
        if (cp[rowIndex][columnIndex].mine !== -1) {
          for (let i = 0; i < 8; i++) {
            let r: number = rowIndex + dir[i][0];
            let c: number = columnIndex + dir[i][1];
            if ((r >= 0) && (r < rows) && (c >= 0) && (c < columns) && (cp[r][c].mine === -1)) {
              cp[rowIndex][columnIndex].mine++;
            }
          }
        }
      })
    })

    dispatch(updateArr(cp));
  }, [boolNewGame])

  useEffect(() => {
    // 게임 완료
    if (answers === 0) {
      dispatch(switchResult(1));
    }
  }, [answers])

  // 우클릭 함수
  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, r: number, c: number) => {
    e.preventDefault();
    if (!arr[r][c].explore && result === 0) {
      const cp: Array<Array<Square>> = JSON.parse(JSON.stringify(arr));
      if (!cp[r][c].checkMine) {
        dispatch(decrementMines());
        cp[r][c].checkMine = true;
        if (cp[r][c].mine === -1) {
          dispatch(decrementAnswers());
        }
      } else {
        dispatch(incrementMines());
        cp[r][c].checkMine = false;
        if (cp[r][c].mine === -1) {
          dispatch(incrementAnswers());
        }
      }
      dispatch(updateArr(cp));
    }
  }

  // 좌클릭 함수
  const handleClick = (r: number, c: number) => {
    const cp: Array<Array<Square>> = JSON.parse(JSON.stringify(arr));
    if (!cp[r][c].explore && result === 0) {

      // 지뢰로 체크한 빨간 칸을 좌클릭 시
      if (cp[r][c].checkMine) {
        cp[r][c].checkMine = false;
        dispatch(incrementMines());
      }

      // 지뢰 클릭시 게임 실패
      if (cp[r][c].mine === -1) {
        dispatch(switchResult(-1));

      // 주위 지뢰 개수가 0이면, 주변을 자동으로 탐사
      } else if (cp[r][c].mine === 0) {
        explore(cp, r, c);

      // 주위 지뢰 개수 !== 0
      } else {
        cp[r][c].explore = true;
        dispatch(decrementAnswers());
      }
    }
    dispatch(updateArr(cp));
  }

  // 주위 지뢰 개수가 0일시, 주변 탐사하는 함수
  const explore = (cp: Array<Array<Square>>, r: number, c: number) => {
    cp[r][c].explore = true;
    if (cp[r][c].checkMine) {
      cp[r][c].checkMine = false;
      dispatch(incrementMines());
    }
    dispatch(decrementAnswers());
    for (let i = 0; i < 8; i++) {
      let r1: number = r + dir[i][0];
      let c1: number = c + dir[i][1];
      if ((r1 >= 0) && (r1 < rows) && (c1 >= 0) && (c1 < columns) && (!cp[r1][c1].explore)) {
        if (cp[r1][c1].mine === 0) {
          explore(cp, r1, c1);
        } else if (cp[r1][c1].mine > 0) {
          cp[r1][c1].explore = true;
          dispatch(decrementAnswers());
          if (cp[r1][c1].checkMine) {
            cp[r1][c1].checkMine = false;
            dispatch(incrementMines());
          }
        }
      }
    }
  }

  return (
    <div className="game">
      {arr.map((row, indexRow) => {
        return (
          <div
            className="row"
            key={indexRow}
          >
            {
              row.map((col, indexCol) => {
                return (
                  <div
                    key={indexCol}
                    className={classnames(
                      'item',

                      // 테두리 css 설정
                      ((indexRow !== rows - 1) && (indexCol !== columns - 1))
                        ? 'borderRightBottom' : '',
                      ((indexRow === rows - 1) && (indexCol !== columns -1))
                        ? 'borderRight' : '',
                      ((indexRow !== rows - 1) && (indexCol === columns -1))
                        ? 'borderBottom' : '',

                      // 칸 상태(지뢰 표시, 탐사 완료)에 따른 배경 css 설정
                      ((result !== -1) && arr[indexRow][indexCol].explore) ? 'gray' : '',
                      ((result !== -1) && arr[indexRow][indexCol].checkMine) ? 'red' : '',

                      // 게임 실패시 정답 공개
                      ((result === -1) && arr[indexRow][indexCol].mine !== -1) ? 'gray' : '',
                      ((result === -1) && arr[indexRow][indexCol].mine === -1) ? 'red' : '',
                    )}
                    onClick={() => handleClick(indexRow, indexCol)}
                    onContextMenu={(e) => handleRightClick(e, indexRow, indexCol)}
                  >
                    {((result === -1) || (
                        arr[indexRow][indexCol].explore && (arr[indexRow][indexCol].mine > 0)))
                      && (arr[indexRow][indexCol].mine > 0) 
                    && arr[indexRow][indexCol].mine}
                  </div>
                )
              })
            }
          </div>
        )
      })}
    </div>
  )
}