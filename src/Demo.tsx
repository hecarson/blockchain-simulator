import React, { useState, useRef, useEffect } from 'react';
import './Demo.css';

interface Validator {
  id: number;
  name: string;
  stakedAmount: number;
  randomNumber?: number;
}

interface Block {
  votes: number;
  id: number;
  validator: Validator;
  timestamp: string;
  isWinningBlock?: boolean;
  columnIndex: number;
}

const ProofOfStake: React.FC = () => {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [randomlySelectedValidator, setRandomlySelectedValidator] = useState<number | null>(null);
  const [userSelectedValidator, setUserSelectedValidator] = useState<number | null>(null);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [validatorCount, setValidatorCount] = useState<number>(4);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [canStartVoting, setCanStartVoting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let nextBlockId = useRef<number>(1);
  let currentColumnIndex = useRef<number>(0);

  useEffect(() => {
    const initialValidators = Array.from({ length: validatorCount }, (_, i) => ({
      id: i + 1,
      name: `Validator ${i + 1}`,
      stakedAmount: Math.floor(Math.random() * 10000) + 1000,
    }));
    setValidators(initialValidators);
  }, [validatorCount]);

  const totalStaked = validators.reduce((total, validator) => total + validator.stakedAmount, 0);

  const pickValidator = () => {
    setCountdown(3);
    const updatedValidators = validators.map(validator => {
      const randomNumber = Math.floor(Math.random() * 100);
      setNetworkLogs(prevLogs => [
        `Validator ${validator.id} created a random number`,
        ...prevLogs.slice(0, 19),
      ]);
      return { ...validator, randomNumber };
    });
    setValidators(updatedValidators);

    const countdownInterval = setInterval(() => {
      setCountdown(prevCountdown => {
        if (prevCountdown !== null) {
          if (prevCountdown > 1) {
            return prevCountdown - 1;
          } else {
            clearInterval(countdownInterval);
            revealRandomNumbers();
            return null;
          }
        }
        return null;
      });
    }, 1000);
  };

  const revealRandomNumbers = () => {
    validators.forEach(validator => {
      if (validator.randomNumber !== undefined) {
        setNetworkLogs(prevLogs => [
          `Validator ${validator.id} revealed random number: ${validator.randomNumber}`,
          ...prevLogs.slice(0, 19),
        ]);
      }
    });

    // Compute the sum of all random numbers and select the validator based on the result
    const sumRandomNumbers = validators.reduce((sum, validator) => sum + (validator.randomNumber || 0), 0);
    const selectedValidatorId = (sumRandomNumbers % validators.length) + 1;
    setRandomlySelectedValidator(selectedValidatorId);

    setNetworkLogs(prevLogs => [
      `Validator ${selectedValidatorId} has been selected based on the random numbers sum`,
      ...prevLogs.slice(0, 19),
    ]);
  };

  const addBlock = () => {
    if (randomlySelectedValidator !== null) {
      const validator = validators.find(v => v.id === randomlySelectedValidator);
      if (validator) {
        const newBlock: Block = {
          id: nextBlockId.current++,
          validator: validator,
          timestamp: new Date().toLocaleTimeString(),
          votes: 0,
          columnIndex: currentColumnIndex.current,
        };
        setBlockchain([...blockchain, newBlock]);
        setNetworkLogs(prevLogs => [
          `Block proposed by Validator ${validator.id} added to the blockchain`,
          ...prevLogs.slice(0, 19),
        ]);
        setCanStartVoting(true);
      }
    }
  };

  const startVoting = () => {
    if (!canStartVoting) return;

    const updatedValidators = validators.map(validator => ({
      ...validator,
      votes: 0,
    }));

    // Each validator votes randomly for one of the blocks that are not already winning
    const nonWinningBlocks = blockchain.filter(block => !block.isWinningBlock);
    if (nonWinningBlocks.length > 0) {
      updatedValidators.forEach(() => {
        const voteFor = Math.floor(Math.random() * nonWinningBlocks.length);
        nonWinningBlocks[voteFor].votes += 1;
      });

      setValidators(updatedValidators);

      // Log the votes each block received
      nonWinningBlocks.forEach(block => {
        setNetworkLogs(prevLogs => [
          `Block ID ${block.id} received ${block.votes} votes`,
          ...prevLogs.slice(0, 19),
        ]);
      });

      // Find the block with the highest votes
      const winningBlock = nonWinningBlocks.reduce((max, block) => (block.votes > max.votes ? block : max), nonWinningBlocks[0]);
      setRandomlySelectedValidator(winningBlock.validator.id);

      // Keep only the winning block and move it to the top of its column, marking it as winning
      const updatedBlockchain = blockchain.map(block =>
        block.id === winningBlock.id
          ? { ...block, votes: 0, isWinningBlock: true, columnIndex: currentColumnIndex.current++ }
          : block
      ).filter(block => block.isWinningBlock);
      setBlockchain(updatedBlockchain);

      setNetworkLogs(prevLogs => [
        `Block ID ${winningBlock.id} won the voting process and is used for the canonical chain`,
        ...prevLogs.slice(0, 19),
      ]);
      setCanStartVoting(false);
    } else {
      setNetworkLogs(prevLogs => [
        `No blocks found for voting`,
        ...prevLogs.slice(0, 19),
      ]);
    }
  };

  const resetBlockchain = () => {
    setBlockchain([]);
    setRandomlySelectedValidator(null);
    setUserSelectedValidator(null);
    setNetworkLogs([]);
    nextBlockId.current = 1;
    currentColumnIndex.current = 0;
    setCanStartVoting(false);
  };

  const clearLogs = () => {
    setNetworkLogs([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const columnWidth = 200;
        const rowHeight = 150;
        const columns: { [key: number]: Block[] } = {};

        blockchain.forEach(block => {
          if (!columns[block.columnIndex]) {
            columns[block.columnIndex] = [];
          }
          columns[block.columnIndex].push(block);
        });

        Object.keys(columns).forEach((columnIndex) => {
          const blocks = columns[Number(columnIndex)];
          blocks.forEach((block, rowIndex) => {
            const x = 50 + Number(columnIndex) * columnWidth;
            const y = 50 + rowIndex * rowHeight;

            ctx.fillStyle = block.isWinningBlock ? '#228B22' : '#000'; // Color the block green if it is the winning block
            ctx.fillRect(x, y, 150, 100);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(`Block ID: ${block.id}`, x + 10, y + 30);
            ctx.fillText(`Validator: ${block.validator.name}`, x + 10, y + 50);
            ctx.fillText(`Time: ${block.timestamp}`, x + 10, y + 70);
          });
        });
      }
    }
  }, [blockchain]);

  return (
    <div className="proof-of-stake">
      <h1>Proof of Stake Visualization</h1>
      <button onClick={() => setInstructionsVisible(!instructionsVisible)}>
        {instructionsVisible ? 'Hide Instructions' : 'Show Instructions'}
      </button>
      {instructionsVisible && (
        <p
          style={{
            maxWidth: "700px", // Set a fixed maximum width
            margin: "0 auto", // Center the text block
            textAlign: "justify", // Align text for readability
            wordWrap: "break-word", // Ensure long words break properly
          }}
        >
          To understand the Proof of Stake process, follow these steps:
          <br />
          1. Click "Select Validator" to randomly select validators that will propose a new block. This simulates the selection process based on stake weights in a real Proof of Stake system.
          <br />
          2. Once a validator is selected, click "Propose New Block" to allow the chosen validator to propose a block. This matches the process in PoS where the selected validator proposes a new block for validation.
          <br />
          3. You can select and propose as many blocks as you want, simulating the continuous proposal of new blocks in a blockchain network.
          <br />
          4. After at least one block is proposed, click "Start Voting". This step simulates the attestation phase in Proof of Stake, where validators attest to the validity of proposed blocks, and a consensus is reached.
        </p>
      )}
      <br />
      <br />
      <button onClick={startVoting} disabled={!canStartVoting || countdown !== null} style={{ backgroundColor: canStartVoting && countdown === null ? '' : 'grey' }}>Start Voting</button>
      <button onClick={pickValidator} disabled={countdown !== null} style={{ backgroundColor: countdown !== null ? 'grey' : '' }}>
        {countdown !== null ? `Select Validator (${countdown})` : 'Select Validator'}
      </button>
      <button onClick={addBlock} disabled={countdown !== null} style={{ backgroundColor: countdown !== null ? 'grey' : '' }}>Propose New Block</button>
      <br />
      <button onClick={resetBlockchain} disabled={countdown !== null} style={{ backgroundColor: countdown !== null ? 'grey' : '' }}>Reset Blockchain</button>
      <button onClick={clearLogs}>Clear Logs</button>
      <br />
      <br />
      <label>Number of Validators:
        <input 
          type="number" 
          value={validatorCount} 
          onChange={(e) => setValidatorCount(parseInt(e.target.value) || 1)} 
          min="1"
        />
      </label>
      <p>Total Staked: {totalStaked} Coins</p>
      <div className="content-wrapper">
        <div className="validators-container">
          <div className="validators-scrollable">
            <table className="validators-table">
              <tbody>
                {validators.map((validator) => (
                  <tr 
                    key={validator.id} 
                    onClick={() => setUserSelectedValidator(validator.id)} 
                    className={`validator-row ${randomlySelectedValidator === validator.id ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: userSelectedValidator === validator.id ? 'lightblue' : 'transparent',
                      border: randomlySelectedValidator === validator.id ? '2px solid red' : '1px solid #ccc'
                    }}
                  >
                    <td>{validator.name} <br/> ({validator.stakedAmount} coins)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userSelectedValidator !== null && (
            <div className="selected-validator">
              <h3>Selected Validator:</h3>
              <p>ID: {userSelectedValidator}</p>
              <p>Name: {validators.find(v => v.id === userSelectedValidator)?.name}</p>
              <p>Staked Amount: {validators.find(v => v.id === userSelectedValidator)?.stakedAmount} Coins</p>
            </div>
          )}
        </div>
        <div className="blockchain">
          <h2>Blockchain</h2>
          <div className="blockchain-scrollable" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <canvas ref={canvasRef} width={1000} height={1000} className="blockchain-canvas"></canvas>
          </div>
          <div className="network-broadcast">
            <h3>Network Broadcast Log:</h3>
            <div className="network-log-scrollable" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              {networkLogs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofOfStake;
